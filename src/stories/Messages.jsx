import './messages.css'
import CircularProgress from '@mui/material/CircularProgress'
import { green } from '@mui/material/colors'
import Chip from '@mui/material/Chip'
import PropTypes from 'prop-types'
import Debug from 'debug'
import DaveIcon from '@mui/icons-material/SentimentDissatisfied'
import ToolIcon from '@mui/icons-material/Construction'
import GoalIcon from '@mui/icons-material/GpsFixed'
import Timeline from '@mui/lab/Timeline'
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import Terminal from '@mui/icons-material/Terminal'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DraftsIcon from '@mui/icons-material/Drafts'
import FolderIcon from '@mui/icons-material/Folder'
import RuleIcon from '@mui/icons-material/Rule'
import Tooltip from '@mui/material/Tooltip'
// import { ToolAction } from './ToolAction'
import remarkGfm from 'remark-gfm'
import Markdown from 'react-markdown'

const debug = Debug('AI:ThreeBox')
const STATUS = { RUNNING: 'RUNNING', DONE: 'DONE', ERROR: 'ERROR' }

const Progress = () => (
  <CircularProgress
    size={42}
    sx={{
      color: green[500],
      position: 'absolute',
      top: -5,
      left: -5,
      zIndex: 1,
    }}
  />
)

const Chat = ({ content, type }) => (
  <TimelineItem>
    <TimelineSeparator>
      <TimelineDot color={chatColors[type]} sx={{ position: 'relative' }}>
        {chatIcons[type]}
        {!content && <Progress />}
      </TimelineDot>
    </TimelineSeparator>
    <TimelineContent className='parent'>
      <Typography variant='h6' component='span'>
        {chatTitles[type]}
      </Typography>
      <br />
      <Markdown remarkPlugins={[remarkGfm]}>{content || ''}</Markdown>
    </TimelineContent>
  </TimelineItem>
)
Chat.propTypes = {
  type: PropTypes.oneOf(['user', 'goalie', 'runner']),
  content: PropTypes.string,
}
const chatColors = { user: 'primary', goalie: 'warning', runner: 'secondary' }
const chatTitles = { user: 'Dave', goalie: 'HAL', runner: 'HAL' }
const chatIcons = {
  user: <DaveIcon />,
  goalie: <GoalIcon />,
  runner: <ToolIcon />,
}

const Dave = ({ content }) => <Chat content={content} type='user' />
Dave.propTypes = {
  content: PropTypes.string,
}
const Assistant = ({ content }) => <Chat content={content} type='goalie' />
Assistant.propTypes = {
  content: PropTypes.string,
}
const Runner = ({ content }) => <Chat content={content} type='runner' />
Runner.propTypes = {
  content: PropTypes.string,
}

const Goal = ({ text, status, helps }) => {
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color='warning' sx={{ position: 'relative' }}>
          <GoalIcon />
          {status !== STATUS.DONE && <Progress />}
        </TimelineDot>
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant='h6' component='span' sx={{ mr: 1 }}>
          HAL
        </Typography>
        <Tooltip title='Goal' arrow placement='left'>
          <Alert icon={<GoalIcon fontSize='small' />} severity='info'>
            {text}
          </Alert>
        </Tooltip>
        {helps.map(({ instructions, done, tld, cmds }, key) => (
          <Card sx={{ m: 1 }} key={key}>
            <List>
              <Tooltip title='Directory' arrow placement='left'>
                <ListItem dense>
                  <ListItemIcon>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText primary={tld} />
                </ListItem>
              </Tooltip>
              <Tooltip title='Commands' arrow placement='left'>
                <ListItem dense>
                  <ListItemIcon>
                    <Terminal />
                  </ListItemIcon>
                  <ListItemText
                    primary={cmds.map((cmd, key) => (
                      <Chip
                        label={cmd}
                        key={key}
                        color='primary'
                        variant='outlined'
                        sx={{ mr: 1, fontWeight: 'bold' }}
                      />
                    ))}
                  />
                </ListItem>
              </Tooltip>
              <Tooltip title='Instructions' arrow placement='left'>
                <ListItem dense>
                  <ListItemIcon>
                    <DraftsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {instructions}
                      </Markdown>
                    }
                  />
                </ListItem>
              </Tooltip>
              <Tooltip title='Checklist' arrow placement='left'>
                <ListItem dense>
                  <ListItemIcon>
                    <RuleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Markdown remarkPlugins={[remarkGfm]}>{done}</Markdown>
                    }
                  />
                </ListItem>
              </Tooltip>
            </List>
          </Card>
        ))}
      </TimelineContent>
    </TimelineItem>
  )
}
Goal.propTypes = {
  text: PropTypes.string.isRequired,
  status: PropTypes.oneOf(Object.values(STATUS)).isRequired,
  helps: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
    })
  ).isRequired,
}

// required: ['type', 'cmd', 'schema', 'args', 'output', 'consequences'],
const Tool = ({ status, cmd, schema, args, output, consequences }) => (
  <TimelineItem>
    <TimelineSeparator>
      <TimelineConnector sx={{ bgcolor: 'secondary.main' }} />
      <TimelineDot color='secondary' sx={{ position: 'relative' }}>
        <ToolIcon />
        {status !== STATUS.DONE && <Progress />}
      </TimelineDot>
      <TimelineConnector sx={{ bgcolor: 'secondary.main' }} />
    </TimelineSeparator>
    <TimelineContent>
      {/* <ToolAction name={cmd} schema={schema} args={args} output={output} /> */}
    </TimelineContent>
  </TimelineItem>
)
Tool.propTypes = {
  status: PropTypes.oneOf(Object.values(STATUS)),
  cmd: PropTypes.string,
  schema: PropTypes.object,
  args: PropTypes.object,
  output: PropTypes.object,
  consequences: PropTypes.object,
}

const Messages = ({ messages = [], isTranscribing }) => {
  return (
    <Timeline
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
    >
      {messages.map(({ role, content }, key) => {
        switch (role) {
          case 'user':
            return <Dave key={key} content={content} />
          case 'assistant':
            return <Assistant key={key} content={content} />
          case 'system':
            return null
          // case 'GOAL':
          //   return <Goal key={key} text={text} status={status} helps={helps} />
          // case 'RUNNER':
          //   return <Runner key={key} text={text} status={status} />
          // case 'TOOL':
          //   return <Tool key={key} {...rest} status={status} />
          // case 'GOAL_END':
          //   return null
          default:
            throw new Error(`unknown type ${role}`)
        }
      })}
      {isTranscribing && <Dave content='(transcribing...)' />}
    </Timeline>
  )
}
Messages.propTypes = {
  isTranscribing: PropTypes.bool,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string,
      content: PropTypes.string,
    })
  ),
}

export default Messages
