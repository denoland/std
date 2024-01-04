import { useAudioRecorder } from 'react-audio-voice-recorder'
import { useFilePicker } from 'use-file-picker'
import { LiveAudioVisualizer } from 'react-audio-visualize'
import React, { useRef, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import MicIcon from '@mui/icons-material/Mic'
import Attach from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/ArrowUpwardRounded'
import OpenAI from 'openai'

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error('VITE_OPENAI_API_KEY is not defined')
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

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

const Input = ({ onSend, preload, preSubmit, onTranscription }) => {
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
  }, [startRecording])
  const send = useCallback(() => {
    setValue('')
    setDisabled(true)
    onSend(value).finally(() => setDisabled(false))
  }, [onSend, value])

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
  }, [recordingBlob])
  useEffect(() => {
    if (!isTransReady) {
      return
    }
    setIsTransReady(false)
    send()
  }, [isTransReady, send])

  const inputProps = {
    endAdornment: (
      <InputAdornment position="end">
        {value ? (
          <Send send={send} />
        ) : (
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
  if (!disabled) {
    inputProps.startAdornment = (
      <InputAdornment position="start">
        <IconButton onClick={openFilePicker}>
          <Attach fontSize="medium" />
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
    [send]
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
  }, [[start, stop, disabled]])

  useEffect(() => {
    if (!preSubmit) {
      return
    }
    send(value)
  }, [])

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
      variant="outlined"
      label="Input"
      placeholder={disabled ? null : 'Message DreamcatcherGPT...'}
      InputProps={inputProps}
      onChange={(e) => setValue(e.target.value)}
      disabled={disabled}
      onKeyDown={onKeyDown}
    />
  )
}
Input.propTypes = {
  onSend: PropTypes.func.isRequired,
  preload: PropTypes.string,
  preSubmit: PropTypes.bool,
  onTranscription: PropTypes.func,
}

export default Input
