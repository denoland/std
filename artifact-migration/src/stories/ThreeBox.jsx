import Input from './Input'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { StateBoard } from './StateBoard'
import { useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Messages from './Messages'
import { useArtifactJSON } from '../react/hooks'
import Git from './Git'

// TODO put the git commit hash under the input box, along with date, time,
// who the current user is, size, latency, etc.

const debug = Debug('AI:ThreeBox')

const ThreeBox = ({ preload, presubmit }) => {
  // useEffect(() => {
  //   const id = setInterval(() => {
  //     window.scrollTo(0, document.body.scrollHeight)
  //   }, 100)
  //   return () => clearInterval(id)
  // }, [])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const onTranscription = useCallback((isTranscribing) => {
    setIsTranscribing(isTranscribing)
  }, [])

  const messages = useArtifactJSON('/chat-1.session.json')
  debug('messages', messages)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        // height: '100%',
        // width: '100%',
        justifyContent: 'center',
      }}
    >
      <Stack
        direction='column'
        alignItems='flex-start'
        justifyContent='flex-end'
        pb={3}
        pr={1}
        sx={{
          minHeight: '100%',
          minWidth: '800px',
          maxWidth: '800px',
        }}
      >
        <Messages messages={messages} isTranscribing={isTranscribing} />
        <Input
          preload={preload}
          presubmit={presubmit}
          onTranscription={onTranscription}
        />
        <Git />
      </Stack>
      {/* <Box sx={{ flexGrow: 1, p: 1 }}>
        <Paper elevation={6} sx={{ height: '100%', flexGrow: 1 }}>
          <StateBoard />
        </Paper>
      </Box> */}
    </Box>
  )
}
ThreeBox.propTypes = {
  preload: PropTypes.string,
  presubmit: PropTypes.bool,
}

export default ThreeBox
