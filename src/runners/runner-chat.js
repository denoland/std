import posix from 'path-browserify'
import merge from 'lodash.merge'
import OpenAI from 'openai'
import { Buffer } from 'buffer'
import * as hooks from '../artifact/io-hooks.js'
import assert from 'assert-fast'
import Debug from 'debug'
import { serializeError } from 'serialize-error'
const debug = Debug('AI:runner-chat')
const debugResult = debug.extend('ai-result-content')
const debugPart = debug.extend('ai-part')
const debugToolCall = debug.extend('ai-result-tool')
const debugToolResult = debug.extend('ai-tool-result')

const { VITE_OPENAI_API_KEY } = import.meta.env

if (!VITE_OPENAI_API_KEY) {
  throw new Error('missing openai api key')
}
const apiKey = Buffer.from(VITE_OPENAI_API_KEY, 'base64').toString('utf-8')
const ai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

export default async ({ help, text }) => {
  assert(typeof help == 'object', `help must be an object: ${typeof help}`)
  assert(typeof text === 'string', 'text must be a string')
  const ai = await AI.create(help)
  return await ai.prompt(text)
}

export class AI {
  #sysprompt
  #config
  #tools
  #actions
  #sessionPath
  static #cache = new Map()
  static async create(help) {
    assert(typeof help === 'object', 'help must be an object')
    const key = JSON.stringify(help)
    if (!AI.#cache.has(key)) {
      const ai = new AI()
      ai.#sessionPath = '/chat-1.session.json'
      ai.#sysprompt = help.instructions.join('\n').trim()
      ai.#config = help.config || {}
      await ai.#loadCommands(help.commands)
      AI.#cache.set(key, ai)
    }
    return AI.#cache.get(key)
  }
  async prompt(text) {
    assert(typeof text === 'string', 'text must be a string')
    assert(text.length, 'text must not be empty')
    let messages = []
    if (await hooks.isFile(this.#sessionPath)) {
      messages = await hooks.readJS(this.#sessionPath)
    }
    assert(Array.isArray(messages), 'messages must be an array')

    if (this.#sysprompt) {
      if (messages[0]?.role === 'system') {
        messages.shift()
      }
      messages.unshift({ role: 'system', content: this.#sysprompt })
    }
    if (text) {
      messages.push({ role: 'user', content: text })
    }
    const assistant = await this.#execute(messages)
    debug('assistant', assistant)
    return assistant
  }

  async #execute(messages) {
    const { model = 'gpt-4-1106-preview', temperature = 0 } = this.#config
    const args = {
      model,
      temperature,
      messages: [...messages],
      stream: true,
      seed: 1,
      tools: this.#tools,
    }
    const assistant = { role: 'assistant' }
    messages.push(assistant)
    await hooks.writeJS(this.#sessionPath, messages)

    debug('streamCall started')
    const streamCall = await ai.chat.completions.create(args)
    debug('streamCall placed')
    for await (const part of streamCall) {
      const content = part.choices[0]?.delta?.content
      if (content) {
        debugPart(content)
        if (!assistant.content) {
          assistant.content = ''
        }
        assistant.content += content
      }

      const toolCalls = part.choices[0]?.delta?.tool_calls
      if (toolCalls) {
        assert(Array.isArray(toolCalls), 'toolCalls must be an array')
        if (!assistant.tool_calls) {
          assistant.tool_calls = []
        }
        for (const call of toolCalls) {
          const { index, ...rest } = call
          assert(Number.isInteger(index), 'toolCalls index must be an integer')
          if (!assistant.tool_calls[index]) {
            assistant.tool_calls[index] = {}
          }
          const existing = assistant.tool_calls[index].function?.arguments || ''
          const args = { function: { arguments: existing } }
          if (rest?.function?.arguments) {
            args.function.arguments += rest.function.arguments
          }
          merge(assistant.tool_calls[index], rest, args)
          debugPart(`%o`, assistant.tool_calls[index]?.function)
        }
      }
      await hooks.writeJS(this.#sessionPath, messages)
    }
    debug('streamCall complete')
    return this.executeTools(messages)
  }
  async executeTools(messages) {
    assert(Array.isArray(messages), 'messages must be an array')
    messages = [...messages]
    const assistant = messages[messages.length - 1]
    if (!assistant.tool_calls) {
      debugResult(assistant.content)
      return assistant.content
    }
    for (const call of assistant.tool_calls) {
      const {
        function: { name, arguments: args },
        id: tool_call_id,
      } = call
      debugToolCall(name, args)
      debug('tool call:', name, args)
      assert(this.#actions[name], `missing action: ${name}`)
      const message = { role: 'tool', tool_call_id }
      messages.push(message)
      await hooks.writeJS(this.#sessionPath, messages)
      try {
        const parameters = JSON.parse(args)
        const result = await this.#actions[name](parameters)
        debug('tool call result:', result)
        if (result === undefined || typeof result === 'string') {
          message.content = result || ''
        } else {
          message.content = JSON.stringify(result, null, 2)
        }
      } catch (error) {
        debug('tool call error:', error)
        message.content = JSON.stringify(serializeError(error), null, 2)
      }
      debugToolResult(message.content)
    }

    await hooks.writeJS(this.#sessionPath, messages)
    return this.#execute(messages)
  }
  async #loadCommands(commands) {
    assert(Array.isArray(commands), 'commands must be an array')
    if (!commands.length) {
      return
    }
    const { load } = await hooks.actions('load-help')
    const result = []
    const names = new Set()
    const actions = {}
    for (const command of commands) {
      debug('loading command:', command)
      let tool, action, name
      if (!command.includes(':')) {
        assert(command.startsWith('helps/'), `invalid help: ${command}`)
        name = posix.basename(command)
        const help = await load({ help: name })
        assert(help.description, `missing description: ${command}`)
        const { engage } = await hooks.spawns('engage-help')
        action = ({ text }) => engage({ help: name, text })
        tool = helpToGptApi(name, help, engage)
      } else {
        const [isolate, _name] = command.split(':')
        name = _name
        const isolateActions = await hooks.actions(isolate)
        assert(isolateActions[name], `isolate missing command: ${command}`)
        action = isolateActions[name]
        tool = isolateToGptApi(name, action)
      }
      assert(action, `missing action: ${command}`)
      assert(!names.has(name), `duplicate action: ${command}`)
      names.add(name)
      assert(typeof action === 'function', `invalid action: ${action}`)
      actions[name] = action
      assert(typeof tool === 'object', `invalid tool: ${tool}`)
      result.push(tool)
    }
    this.#actions = actions
    this.#tools = result
  }
}
const helpToGptApi = (name, help, engage) => {
  const { api } = engage
  assert(typeof api === 'object', 'api must be an object')
  assert(typeof api.type === 'string', 'api.type must be a string')
  const parameters = {
    type: 'object',
    additionalProperties: false,
    required: ['text'],
    properties: {
      text: api.properties.text,
    },
  }

  return {
    type: 'function',
    function: {
      name,
      description: help.description,
      parameters,
    },
  }
}

const isolateToGptApi = (name, action) => {
  const { api } = action
  assert(typeof api === 'object', 'api must be an object')
  assert(typeof api.type === 'string', 'api.type must be a string')
  const { ...parameters } = api
  delete parameters.title
  delete parameters.description
  return {
    type: 'function',
    function: {
      name,
      description: api.description,
      parameters,
    },
  }
}
