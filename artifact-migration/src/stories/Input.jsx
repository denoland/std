import { usePrompt } from '../react/hooks'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import { useFilePicker } from 'use-file-picker'
import { LiveAudioVisualizer } from 'react-audio-visualize'
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import MicIcon from '@mui/icons-material/Mic'
import Attach from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/ArrowUpwardRounded'
import OpenAI from 'openai'
import { Buffer } from 'buffer'

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error('VITE_OPENAI_API_KEY is not defined')
}
const { VITE_OPENAI_API_KEY } = import.meta.env
const apiKey = Buffer.from(VITE_OPENAI_API_KEY, 'base64').toString('utf-8')
const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

const debug = Debug('AI:Input')

const Send = ({ send }) => (
  <IconButton onClick={send}>
    <SendIcon />
  </IconButton>
)
Send.propTypes = { send: PropTypes.func }

const Mic = ({ onEvent }) => (
  <IconButton onClick={onEvent}>
    <MicIcon />
  </IconButton>
)
Mic.propTypes = { onEvent: PropTypes.func.isRequired }

const Input = ({ preload, presubmit, onTranscription }) => {
  const [error, setError] = useState()
  if (error) {
    throw error
  }

  const [value, setValue] = useState(preload || '')
  const [disabled, setDisabled] = useState(false)
  const [isTransReady, setIsTransReady] = useState(false)
  const {
    startRecording,
    stopRecording,
    recordingBlob,
    isRecording,
    mediaRecorder,
  } = useAudioRecorder()
  const start = useCallback(() => {
    startRecording()
    onTranscription && onTranscription(true)
    setDisabled(true)
  }, [startRecording, onTranscription])

  const prompt = usePrompt()
  const send = useCallback(() => {
    debug('send', value)
    setValue('')
    setDisabled(true)
    prompt(value)
      .catch(setError)
      .finally(() => setDisabled(false))
      .then((result) => debug('result', result?.content))
  }, [prompt, value])

  useEffect(() => {
    if (!recordingBlob) {
      return
    }
    const file = new File([recordingBlob], 'recording.webm', {
      type: recordingBlob.type,
    })
    openai.audio.transcriptions
      .create({ file, model: 'whisper-1' })
      .then((transcription) => {
        setValue(transcription.text)
        setIsTransReady(true)
      })
      .catch(console.error)
      .finally(() => {
        onTranscription && onTranscription(false)
        setDisabled(false)
      })
  }, [recordingBlob, onTranscription])
  useEffect(() => {
    if (!isTransReady) {
      return
    }
    setIsTransReady(false)
    send()
  }, [isTransReady, send])

  const inputProps = {
    endAdornment: (
      <InputAdornment position='end'>
        {value ? <Send send={send} /> : (
          <>
            {isRecording && (
              <LiveAudioVisualizer height={50} mediaRecorder={mediaRecorder} />
            )}
            <Mic onEvent={isRecording ? stopRecording : start} />
          </>
        )}
      </InputAdornment>
    ),
  }
  const { openFilePicker, filesContent, loading } = useFilePicker({
    accept: '.txt',
  })
  // TODO if a file is uploaded, store on fs, then sample it, then goal it
  if (!disabled) {
    inputProps.startAdornment = (
      <InputAdornment position='start'>
        <IconButton onClick={openFilePicker}>
          <Attach fontSize='medium' />
        </IconButton>
      </InputAdornment>
    )
  }

  const onKeyDown = useCallback(
    (e) => {
      const isUnmodified = !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey
      if (e.key === 'Enter' && isUnmodified) {
        e.preventDefault()
        send()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setValue('')
      }
    },
    [send],
  )
  useEffect(() => {
    const listener = (e) => {
      if (e.key === ' ' && e.ctrlKey) {
        if (disabled && !isRecording) {
          return
        }
        e.preventDefault()
        setValue('')
        if (isRecording) {
          stopRecording()
        } else {
          start()
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [start, disabled, isRecording, stopRecording])

  const [doPreSubmit, setDoPreSubmit] = useState(presubmit)
  useEffect(() => {
    if (!doPreSubmit) {
      return
    }
    setDoPreSubmit()
    send(value)
  }, [doPreSubmit, send, value])

  return (
    <TextField
      inputRef={(ref) => {
        if (!ref) {
          return
        }
        if (!disabled) {
          ref.focus()
        }
      }}
      value={disabled ? ' ' : value}
      multiline
      fullWidth
      variant='outlined'
      label='Input'
      placeholder={disabled ? null : 'Message DreamcatcherGPT...'}
      InputProps={inputProps}
      onChange={(e) => setValue(e.target.value)}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
  )
}
Input.propTypes = {
  preload: PropTypes.string,
  presubmit: PropTypes.bool,
  onTranscription: PropTypes.func,
}

export default Input
