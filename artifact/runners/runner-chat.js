import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import debug from '$debug'
import merge from 'npm:lodash.merge'
import OpenAI from 'npm:openai'
import * as hooks from '@io/io-hooks.js'
import { serializeError } from 'npm:serialize-error'
import { load } from 'https://deno.land/std@0.213.0/dotenv/mod.ts'

const base = 'AI:runner-chat'
const log = debug(base)
const debugResult = debug(base + ':ai-result-content')
const debugPart = debug(base + ':ai-part')
const debugToolCall = debug(base + ':ai-result-tool')
const debugToolResult = debug(base + ':ai-tool-result')

const env = await load()

if (!env['OPENAI_API_KEY']) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const apiKey = env['OPENAI_API_KEY']
const ai = new OpenAI({ apiKey })

export default async ({ help, text }, api) => {
  assert(typeof help == 'object', `help must be an object: ${typeof help}`)
  assert(typeof text === 'string', 'text must be a string')
  const ai = await AI.create(help, api)
  return await ai.prompt(text)
}

export class AI {
  #sysprompt
  #config
  #tools
  #actions
  #sessionPath
  #api
  static #cache = new Map()
  static async create(help, api) {
    assert(typeof help === 'object', 'help must be an object')
    const key = JSON.stringify(help)
    if (!AI.#cache.has(key)) {
      const ai = new AI()
      ai.#sessionPath = '/chat-1.session.json'
      ai.#sysprompt = help.instructions.join('\n').trim()
      ai.#config = help.config || {}
      ai.#api = api
      await ai.#loadCommands(help.commands)
      AI.#cache.set(key, ai)
    }
    return AI.#cache.get(key)
  }
  async prompt(text) {
    assert(typeof text === 'string', 'text must be a string')
    assert(text.length, 'text must not be empty')
    let messages = []
    // if (await hooks.isFile(this.#sessionPath)) {
    //   messages = await hooks.readJS(this.#sessionPath)
    // }
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
    log('assistant', assistant)
    return assistant
  }

  async #execute(messages) {
    const { model = 'gpt-4-turbo-preview', temperature = 0 } = this.#config
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
    // await hooks.writeJS(this.#sessionPath, messages)

    log('streamCall started')
    const streamCall = await ai.chat.completions.create(args)
    log('streamCall placed')
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
      // await hooks.writeJS(this.#sessionPath, messages)
    }
    log('streamCall complete')
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
      log('tool call:', name, args)
      assert(this.#actions[name], `missing action: ${name}`)
      const message = { role: 'tool', tool_call_id }
      messages.push(message)
      await hooks.writeJS(this.#sessionPath, messages)
      try {
        const parameters = JSON.parse(args)
        const result = await this.#actions[name](parameters)
        log('tool call result:', result)
        if (result === '@@ARTIFACT_RELAY@@') {
          log('tool call relay')

          const withoutTip = messages.slice(0, -1)
          const lastToolCall = withoutTip
            .reverse()
            .findLast(({ role }) => role === 'tool')
          assert(lastToolCall, 'missing last tool call')
          message.content = lastToolCall.content
          // await hooks.writeJS(this.#sessionPath, messages)

          return message.content
        }

        if (result === undefined || typeof result === 'string') {
          message.content = result || ''
        } else {
          message.content = JSON.stringify(result, null, 2)
        }
      } catch (error) {
        log('tool call error:', error)
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
    const { load } = await this.#api.isolateActions('load-help')
    const result = []
    const names = new Set()
    const actions = {}
    for (const command of commands) {
      log('loading command:', command)
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
        const isolateActions = await this.#api.inBand(isolate)
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
  assert(typeof api === 'object', `api must be an object: ${name}`)
  assert(typeof api.type === 'string', `api.type must be a string: ${name}`)
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
