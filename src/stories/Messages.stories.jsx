import Messages from './Messages'
import play from './play'
import Debug from 'debug'
import Box from '@mui/material/Box'
const debug = Debug('Messages')
const STATUS = { RUNNING: 'RUNNING', DONE: 'DONE', ERROR: 'ERROR' }

export default {
  title: 'Messages',
  // component: Messages,
}

const messages = [
  { role: 'user', content: 'say a single word' },
  { role: 'assistant', content: 'Hello!' },
  {
    role: 'assistant',
    content: `
  \`\`\`markdown
  ![Placeholder Image](https://via.placeholder.com/150 "This is a placeholder image")
  \`\`\`
  ![Placeholder Image](https://via.placeholder.com/150 "This is a placeholder image")
  
  When you view this in a compatible environment, you should see a 150x150 pixel placeholder image with the alt text "Placeholder Image" and a title that appears as a tooltip saying "This is a placeholder image".`,
  },
]

const state = {
  mode: 'GOALIE',
  messages: [
    {
      type: 'USER',
      text: 'list all customers',
      status: STATUS.RUNNING,
    },
    {
      type: 'USER',
      text: 'asdf',
      status: STATUS.DONE,
    },
    {
      type: 'GOALIE',
      text: 'Whatever do you mean, sir?',
      status: STATUS.RUNNING,
    },
    {
      type: 'GOALIE',
      text: 'Whatever do you mean, sir?',
      status: STATUS.DONE,
    },
    {
      type: 'GOAL',
      text: 'list all customers',
      helps: [],
      status: STATUS.RUNNING,
    },
    {
      type: 'GOAL',
      text: 'list all customers',
      helps: [
        {
          type: 'Artifact',
          instructions: `**blah**
          Do some things, then *stop*`,
          done: 'check some stuff',
          tld: '/apps/crm/customers',
          cmds: ['ls', 'add', 'update', 'delete'],
        },
      ],
      status: STATUS.DONE,
    },
    {
      type: 'RUNNER',
      text: 'give me the customer name',
      status: STATUS.RUNNING,
    },
    {
      type: 'RUNNER',
      text: 'give me the customer name',
      status: STATUS.DONE,
    },
    {
      type: 'TOOL',
      status: STATUS.RUNNING,
      id: 'call_rKr0rUpzdG6iCP1qZTnZg7kx',
      cmd: '/apps/crm/customers/add',
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      args: { name: 'bob' },
    },
    {
      type: 'TOOL',
      status: STATUS.DONE,
      id: 'call_rKr0rUpzdG6iCP1qZTnZg7kx',
      cmd: '/apps/crm/customers/add',
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      args: { name: 'bob' },
      output: { id: '123', name: 'bob' },
    },
  ],
}

const Template = () => {
  return <Messages messages={messages} />
}

export const Chat = Template.bind({})
export const Narrow = () => {
  return (
    <Box sx={{ background: 'red', maxWidth: '400px' }}>
      <Messages messages={messages} />
    </Box>
  )
}
// Narrow.parameters = { layout: 'centered' }
