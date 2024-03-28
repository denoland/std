import { assert } from 'std/assert/mod.ts'
import * as posix from 'https://deno.land/std@0.213.0/path/posix/mod.ts'
import { Debug } from '@utils'
import merge from 'npm:lodash.merge'
import OpenAI from 'npm:openai'
import { serializeError } from 'npm:serialize-error'
import { load } from 'https://deno.land/std@0.213.0/dotenv/mod.ts'
import { Help, IsolateApi } from '@/constants.ts'
import { HelpConfig, JSONSchemaType } from '@/constants.ts'
import { JsonValue } from '@/constants.ts'
type MessageParam = OpenAI.ChatCompletionMessageParam
const base = 'AI:runner-chat'
const log = Debug(base)
const debugResult = Debug(base + ':ai-result-content')
const debugPart = Debug(base + ':ai-part')
const debugToolCall = Debug(base + ':ai-result-tool')
const debugToolResult = Debug(base + ':ai-tool-result')

const env = await load()

if (!env['OPENAI_API_KEY']) {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    throw new Error('missing openai api key: OPENAI_API_KEY')
  }
  env['OPENAI_API_KEY'] = key
}
const apiKey = env['OPENAI_API_KEY']
const ai = new OpenAI({ apiKey, timeout: 20 * 1000, maxRetries: 5 })
type Args = { text: string; help: Help }
export default async (params: Args, api: IsolateApi) => {
  const help = params.help
  const text = params.text
  const ai = await AI.create(help, api)
  return await ai.prompt(text)
}

export class AI {
  #sysprompt!: string
  #config: HelpConfig = {}
  #tools: OpenAI.ChatCompletionTool[] | undefined
  #actions: Record<string, (parameters: object) => unknown> = {}
  #sessionPath = 'session.json'
  #api!: IsolateApi
  static async create(help: Help, api: IsolateApi) {
    const ai = new AI()
    // TODO ensure caching on api calls to generate actions
    ai.#sysprompt = help.instructions.join('\n').trim()
    ai.#config = help.config || {}
    ai.#api = api
    await ai.#loadCommands(help.commands)
    return ai
  }
  async prompt(text: string) {
    assert(text.length, 'text must not be empty')
    let messages: MessageParam[] = []
    if (await this.#api.exists(this.#sessionPath)) {
      log('session exists')
      messages = await this.#api.readJSON<MessageParam[]>(this.#sessionPath)
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
    log('assistant', assistant)
    return assistant
  }

  async #execute(messages: MessageParam[]): Promise<string> {
    const { model = 'gpt-4-turbo-preview', temperature = 0 } = this.#config
    const args: OpenAI.ChatCompletionCreateParamsStreaming = {
      model,
      temperature,
      messages: [...messages],
      stream: true,
      seed: 1,
      tools: this.#tools,
    }
    const assistant: OpenAI.ChatCompletionMessage = {
      role: 'assistant',
      content: null,
    }
    messages.push(assistant)
    // TODO find why ts types do not overlap
    const squelched = messages as unknown as JsonValue[]
    this.#api.writeJSON(this.#sessionPath, squelched)

    log('streamCall started')
    // TODO move this to an isolate call that runs in a branch
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
            const { id } = call
            assert(id, 'toolCalls id must be a string')
            const callChunk = {} as OpenAI.ChatCompletionMessageToolCall
            assistant.tool_calls[index] = callChunk
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
      const squelched = messages as unknown as JsonValue[]
      this.#api.writeJSON(this.#sessionPath, squelched)
    }
    log('streamCall complete')
    // this should be an accumulation action with the messages path as payload
    return this.executeTools(messages)
  }
  async executeTools(messages: MessageParam[]): Promise<string> {
    messages = [...messages]
    const assistant =
      messages[messages.length - 1] as OpenAI.ChatCompletionMessage
    if (!assistant.tool_calls) {
      debugResult(assistant.content || '')
      return assistant.content || ''
    }
    // TODO use the new runTools helper with a parser
    for (const call of assistant.tool_calls) {
      const {
        function: { name, arguments: args },
        id: tool_call_id,
      } = call
      debugToolCall(name, args)
      log('tool call:', name, args)
      assert(this.#actions[name], `missing action: ${name}`)
      const message: OpenAI.ChatCompletionToolMessageParam = {
        role: 'tool',
        tool_call_id,
        content: '',
      }
      messages.push(message)
      const squelched = messages as unknown as JsonValue[]
      this.#api.writeJSON(this.#sessionPath, squelched)

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
          message.content = (lastToolCall.content || '') as string
          const squelched = messages as unknown as JsonValue[]
          this.#api.writeJSON(this.#sessionPath, squelched)

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

    const squelched = messages as unknown as JsonValue[]
    this.#api.writeJSON(this.#sessionPath, squelched)
    return this.#execute(messages)
  }
  async #loadCommands(commands: string[] = []) {
    const tools: OpenAI.ChatCompletionTool[] = []
    const names = new Set()
    for (const command of commands) {
      log('loading command:', command)
      let tool: OpenAI.ChatCompletionTool, action, name: string
      if (!command.includes(':')) {
        assert(command.startsWith('helps/'), `invalid help: ${command}`)
        name = posix.basename(command)
        const { load } = await this.#api.functions('load-help')
        const help = await load({ help: name })
        assert(help.description, `missing description: ${command}`)
        const schemas = await this.#api.isolateApiSchema('engage-help')
        const { engage } = await this.#api.actions('engage-help')
        action = ({ text }: { text: string }) => {
          log('engage:', name, text)
          return engage({ help: name, text }, { branch: true })
        }
        tool = toTool(name, help, schemas.engage)
      } else {
        const [isolate, _name] = command.split(':')
        name = _name
        const functions = await this.#api.functions(isolate)
        const isolateApiSchema = await this.#api.isolateApiSchema(isolate)
        assert(functions[name], `isolate missing command: ${command}`)
        action = functions[name]
        const api = isolateApiSchema[name]
        tool = isolateToGptApi(name, api)
      }
      assert(action, `missing action: ${command}`)
      assert(!names.has(name), `duplicate action: ${command}`)
      names.add(name)
      assert(typeof action === 'function', `invalid action: ${action}`)
      this.#actions[name] = action
      assert(typeof tool === 'object', `invalid tool: ${tool}`)
      tools.push(tool)
    }
    if (tools.length) {
      this.#tools = tools
    }
  }
}
const toTool = (name: string, help: Help, schema: JSONSchemaType<object>) => {
  const parameters = {
    type: 'object',
    additionalProperties: false,
    required: ['text'],
    properties: {
      text: schema.properties.text,
    },
  }

  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name,
      description: help.description,
      parameters,
    },
  }
  return tool
}
const isolateToGptApi = (name: string, schema: JSONSchemaType<object>) => {
  assert(typeof schema === 'object', `api must be an object: ${name}`)
  assert(typeof schema.type === 'string', `api.type must be a string: ${name}`)
  const parameters: Record<string, unknown> = { ...schema }
  delete parameters.title
  delete parameters.description
  const tool: OpenAI.ChatCompletionTool = {
    type: 'function',
    function: {
      name,
      description: schema.description,
      parameters,
    },
  }
  return tool
}

export const transcribe = async (file: File) => {
  // TODO useEffect() here ?
  const transcription = await ai.audio.transcriptions
    .create({ file, model: 'whisper-1' })
  return transcription.text
}
