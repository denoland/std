import merge from 'lodash.merge'
import OpenAI from 'openai'
import Debug from 'debug'
import assert from 'assert-fast'
import { Buffer } from 'buffer'
const debug = Debug('AI:promptRunner')
const model = 'gpt-4-1106-preview'
// const model = 'gpt-3.5-turbo-1106'
const { VITE_OPENAI_API_KEY } = import.meta.env

if (!VITE_OPENAI_API_KEY) {
  throw new Error('missing openai api key')
}
const apiKey = Buffer.from(VITE_OPENAI_API_KEY, 'base64').toString('utf-8')
const ai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

// hooks to get filesystem access which handles triggers and permissions
// hooks to handle commits and memos

export default async ({ fs, sessionPath, text, trigger }) => {
  // ? where would the sysprompt have come from ?
  const session = await fs.readFile(sessionPath, 'utf8')
  const messages = JSON.parse(session)
  messages.push({ role: 'user', content: text })
  const write = writerFactory(fs, sessionPath, trigger)
  await write(messages)

  const args = {
    model,
    temperature: 0,
    messages: [...messages],
    stream: true,
    seed: 1337,
  }
  const assistant = { role: 'assistant' }
  messages.push(assistant)
  await write(messages)
  const streamCall = await ai.chat.completions.create(args)

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
          rest = merge({}, rest, { function: { arguments: JSON.parse(args) } })
          merge(assistant.toolCalls[index], rest)
        }
      }
    }

    // TODO debounce this writing
    // TODO add a ram cache atop the fs
    await write(messages)
  }
  return assistant
}

const writerFactory = (fs, sessionPath, trigger) => {
  return async (messages) => {
    assert(Array.isArray(messages), 'messages must be an array')
    const file = JSON.stringify(messages)
    await fs.writeFile(sessionPath, file)
    trigger.write(sessionPath, file)
  }
}

const isArgsParseable = (args) => {
  try {
    JSON.parse(args)
    return true
  } catch (err) {
    return false
  }
}
