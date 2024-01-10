import merge from 'lodash.merge'
import OpenAI from 'openai'
import { isolate } from './io-hooks'
import Debug from 'debug'
import assert from 'assert-fast'
import { Buffer } from 'buffer'
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

export const api = {
  prompt: {
    description: 'prompt the AI',
    type: 'object',
    properties: {
      text: {
        description: 'the text to prompt the AI with',
        type: 'string',
      },
    },
  },
}

export const functions = {
  prompt: async ({ text }, config) => {
    assert(typeof text === 'string', 'text must be a string')
    assert(text.length, 'text must not be empty')

    const { sessionPath, systemPromptPath } = config
    const fs = isolate()
    const messages = await fs.read(sessionPath)
    assert(Array.isArray(messages), 'messages must be an array')

    // read in the sysprompt from the
    const sysprompt = await fs.readFile(systemPromptPath)

    // reinsert the sysprompt in case it changed
    messages.shift()
    messages.unshift({ role: 'assistant', content: sysprompt })

    messages.push({ role: 'user', content: text })
    const args = {
      model,
      temperature: 0,
      messages: [...messages],
      stream: true,
      seed: 1337,
    }
    const assistant = { role: 'assistant' }
    messages.push(assistant)
    await fs.write(messages, sessionPath)

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
            rest = merge({}, rest, {
              function: { arguments: JSON.parse(args) },
            })
            merge(assistant.toolCalls[index], rest)
          }
        }
      }

      await fs.write(messages, sessionPath)
    }
    return assistant
  },
}

const isArgsParseable = (args) => {
  try {
    JSON.parse(args)
    return true
  } catch (err) {
    return false
  }
}
