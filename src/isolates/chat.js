import posix from 'path-browserify'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import { isolate } from '../exec/io-hooks'
import assert from 'assert-fast'
import { Buffer } from 'buffer'
import Debug from 'debug'
const debug = Debug('AI:isolates:chat')
const model = 'gpt-4-1106-preview'
// const model = 'gpt-3.5-turbo-1106'

const { VITE_OPENAI_API_KEY } = import.meta.env

if (!VITE_OPENAI_API_KEY) {
  throw new Error('missing openai api key')
}
const apiKey = Buffer.from(VITE_OPENAI_API_KEY, 'base64').toString('utf-8')
const ai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

export const api = {
  prompt: {
    description: 'prompt the AI',
    type: 'object',
    properties: {
      text: {
        description: 'the text to prompt the AI with',
        type: 'string',
      },
      noSysPrompt: { type: 'boolean' },
    },
  },
}

export const functions = {
  prompt: async ({ text, noSysPrompt = false }) => {
    assert(typeof text === 'string', 'text must be a string')
    assert(text.length, 'text must not be empty')
    const fs = isolate()
    let messages = []
    const sessionPath = '/chat-1.session.json'
    if (await fs.isFile(sessionPath)) {
      messages = await fs.readJS(sessionPath)
    }
    assert(Array.isArray(messages), 'messages must be an array')

    // TODO make this dynamic
    if (!noSysPrompt) {
      const { default: curtains } = await import(`../helps/curtains`)
      const sysprompt = curtains.instructions.join('\n').trim()
      messages.shift()
      // add in the tools that can be called
      messages.unshift({ role: 'system', content: sysprompt })
    }
    if (text) {
      messages.push({ role: 'user', content: text })
    }
    const assistant = await execute(messages, sessionPath)
    debug('assistant', assistant)
    return assistant
  },
  engage: async ({ helpPath }, config) => {
    // load up the help from the helpPath using the helpreader
    // load up the commands that are to be injected
  },

  // mounting the help would be the same as setting it at the end of an io queue
  // this might be easier than calling something that then calls the io queue
}

const helpReader = async (helpPath) => {
  // read in the help
  // check the schema for it
  // send back an object with some convenience methods
}

const isArgsParseable = (args) => {
  try {
    JSON.parse(args)
    return true
  } catch (err) {
    return false
  }
}

const execute = async (messages, sessionPath) => {
  const args = {
    model,
    temperature: 0,
    messages: [...messages],
    stream: true,
    seed: 1337,
  }
  const assistant = { role: 'assistant' }
  messages.push(assistant)
  const fs = isolate()
  await fs.writeJS(messages, sessionPath)

  debug('streamCall started')
  const streamCall = await ai.chat.completions.create(args)
  debug('streamCall placed')
  for await (const part of streamCall) {
    const content = part.choices[0]?.delta?.content || ''
    if (!assistant.content) {
      assistant.content = ''
    }
    assistant.content += content

    const toolCalls = part.choices[0]?.delta?.tool_calls
    if (toolCalls) {
      assert(Array.isArray(toolCalls), 'toolCalls must be an array')
      if (!assistant.toolCalls) {
        assistant.toolCalls = []
      }
      for (const call of toolCalls) {
        let { index, ...rest } = call
        assert(Number.isInteger(index), 'toolCalls index must be an integer')

        let args = assistant.toolCalls[index]?.function?.arguments || ''
        args += rest?.function?.arguments || ''
        if (args && isArgsParseable(args)) {
          if (!assistant.toolCalls[index]) {
            assistant.toolCalls[index] = {}
          }
          rest = merge({}, rest, {
            function: { arguments: JSON.parse(args) },
          })
          merge(assistant.toolCalls[index], rest)
        }
      }
    }
    await fs.writeJS(messages, sessionPath)
  }
  debug('streamCall complete')
  return tools(messages, sessionPath)
}

const tools = async (messages, sessionPath) => {
  assert(Array.isArray(messages), 'messages must be an array')
  assert(posix.isAbsolute(sessionPath), 'sessionPath must be absolute')
  const assistant = messages[messages.length - 1]
  if (!assistant.toolCalls) {
    return assistant.content
  }
  for (const call of assistant.toolCalls) {
    const { function: functionName, arguments: args } = call

    await io(path, functionName, args)

    // make sure these were what the prompt was loaded with
    // get the path from the config
    // dispatch an action to those io channels
    // ? should commit happen

    // need a different dispatch, since no waiting for results
    // io watcher should handle new replies too
    const result = await fs.call(functionName, arguments)
    call.result = result
    // load these up on the messages again, and re-run the ai
  }
  return execute(messages, sessionPath)
}
