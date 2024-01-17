import posix from 'path-browserify'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import { Buffer } from 'buffer'
import * as hooks from '../artifact/io-hooks.js'
import assert from 'assert-fast'
import Debug from 'debug'
const debug = Debug('AI:runner-chat')
const { VITE_OPENAI_API_KEY } = import.meta.env

if (!VITE_OPENAI_API_KEY) {
  throw new Error('missing openai api key')
}
const apiKey = Buffer.from(VITE_OPENAI_API_KEY, 'base64').toString('utf-8')
const ai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

export default async ({ help, text }) => {
  assert(typeof help === 'object', 'help must be an object')
  assert(typeof text === 'string', 'text must be a string')
  // runners always get called with the help object and the text string
  const sysprompt = help.instructions.join('\n').trim()
  return await prompt({ text, sysprompt })
}

const prompt = async ({ text, sysprompt }) => {
  assert(typeof text === 'string', 'text must be a string')
  assert(text.length, 'text must not be empty')
  let messages = []
  const sessionPath = '/chat-1.session.json'
  if (await hooks.isFile(sessionPath)) {
    messages = await hooks.readJS(sessionPath)
  }
  assert(Array.isArray(messages), 'messages must be an array')

  if (sysprompt) {
    if (messages[0]?.role === 'system') {
      messages.shift()
    }
    // add in the tools that can be called
    messages.unshift({ role: 'system', content: sysprompt })
  }
  if (text) {
    messages.push({ role: 'user', content: text })
  }
  const assistant = await execute(messages, sessionPath)
  debug('assistant', assistant)
  return assistant
}

const execute = async (messages, sessionPath) => {
  const args = {
    model: 'gpt-4-1106-preview', // pass this in via config in the help
    temperature: 0,
    messages: [...messages],
    stream: true,
    seed: 1337,
  }
  const assistant = { role: 'assistant' }
  messages.push(assistant)
  await hooks.writeJS(messages, sessionPath)

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
    await hooks.writeJS(messages, sessionPath)
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

const isArgsParseable = (args) => {
  try {
    JSON.parse(args)
    return true
  } catch (err) {
    return false
  }
}
