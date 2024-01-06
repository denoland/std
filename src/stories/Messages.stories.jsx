import Messages from './Messages'
import play from './play'
import Debug from 'debug'
const debug = Debug('Messages')
const STATUS = { RUNNING: 'RUNNING', DONE: 'DONE', ERROR: 'ERROR' }

export default {
  title: 'Messages',
  // component: Messages,
}

const messages = [
  { role: 'user', content: 'say a single word' },
  { role: 'assistant', content: 'Hello!' },
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
