import { assert } from '@std/assert'
import Debug from 'debug'
import { base64 } from '@scure/base'
import '@std/dotenv/load' // load .env variables
import OpenAI from 'openai'
import { decode, Image } from 'imagescript'

import { mockCreator } from './utils/mocker.ts'
import {
  Agent,
  AssistantMessage,
  ChatParams,
  chatParams,
  CompletionMessage,
  Functions,
  getThreadPath,
  type IA,
  messageStatsSchema,
  print,
  printPlain,
  Returns,
  Thread,
  ToApiType,
} from '@/constants.ts'
import { loadTools } from './utils/ai-load-tools.ts'
import { loadAgent } from './utils/load-agent.ts'
import { z } from 'zod'
import { assistantMessage } from '@/api/zod.ts'
import { expect } from '@std/expect/expect'

const log = Debug('AI:completions')

const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  throw new Error('missing openai api key: OPENAI_API_KEY')
}
const ai = new OpenAI({ apiKey, maxRetries: 5 })

export const transcribe = async (file: File) => {
  const transcription = await ai.audio.transcriptions
    .create({
      file,
      model: 'whisper-1',
      prompt:
        'Backchat, GPT4, GPT3, Dreamcatcher, CRM, HAL, Deno, Stucks, Redlid, Pijul',
    })
  return transcription.text
}

export const parameters = {
  /** Complete the thread with the given agent */
  complete: z.object({
    path: z.string(),
  }),
  /** Gives slightly quicker feedback to users when waiting for completions */
  completionEffect: z.object({
    path: z.string(),
  }),
  image: z.object({
    path: z.string().regex(/\.jpg$/, {
      message: 'The path must end with .jpg',
    }).describe(
      'The path to the image to generate, which should be a meaningful name in the images/ directory, and should end in .jpg',
    ),
    prompt: z.string().max(4000),
    lowQuality: z.boolean().optional().describe(
      'Generate a low quality image as opposed to the default high quality image',
    ),
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional()
      .describe(
        'The size of the image to generate',
      ),
    style: z.enum(['vivid', 'natural']).optional().describe(
      'The style of the image to generate, which defaults to vivid',
    ),
  }).describe(
    'Generate an image using DALL-E-3 from the provided prompt.  The image will be saved to the provided path.  The revised prompt that the image generator used will be returned, as well as the size of the image in bytes.',
    // TODO add how to show in stateboard
  ),
}
export const returns: Returns<typeof parameters> = {
  complete: z.void(),
  completionEffect: z.void(),
  image: z.object({
    /** The revised prompt that the image generation system used */
    revisedPrompt: z.string(),
    /** The size in bytes of the written image */
    size: z.number().int().gte(0),
  }),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  async complete({ path }, api) {
    const threadPath = getThreadPath(api.pid)
    log('completing thread %o', threadPath, print(api.pid))

    const agent = await loadAgent(path, api)
    const thread = await api.readThread(threadPath)
    thread.messages.push({ role: 'assistant', name: agent.source.path })
    api.writeJSON(threadPath, thread)

    const { completionEffect } = await api.actions<Api>('ai-completions')
    await completionEffect({ path })
  },
  async completionEffect({ path }, api) {
    const threadPath = getThreadPath(api.pid)
    log('completing thread %o', threadPath, print(api.pid))

    const agent = await loadAgent(path, api)

    const thread = await api.readThread(threadPath)
    const last = thread.messages.pop()
    assert(last, 'no messages in thread')
    assert(last.role === 'assistant', 'last message must be assistant')
    assert(
      last.name === agent.source.path,
      'last message must be from agent',
    )
    assert(!last.content, 'last message must be empty')

    const { assistant, stats } = await complete(agent, thread.messages, api)

    const id = thread.messages.length + thread.messageOffset
    thread.messageStats[id] = stats
    thread.messages.push(assistant)
    api.writeJSON(threadPath, thread)
    log('completion complete', assistant.tool_calls?.[0], assistant.content)
  },
  async image(params, api) {
    const { path } = params
    const { data, response } = await image(params, api)
    log('headers', response.statusText)
    const { b64_json, revised_prompt } = data.data[0]
    if (!b64_json) {
      throw new Error('no image data')
    }
    const imageData = base64.decode(b64_json)
    log('image length', imageData.length)

    const png = await decode(imageData)
    assert(png instanceof Image, 'image must be an instance of Image')
    const jpg = await png.encodeJPEG()
    log('length', jpg.length)

    api.write(path, jpg)
    return { revisedPrompt: revised_prompt, size: jpg.length }
  },
}

export const image = async (
  params: z.infer<typeof parameters['image']>,
  api: IA,
) => {
  const { prompt, lowQuality, size, style } = params
  const id = printPlain(api.pid)
  const recording = imageMock.next(id)
  if (recording) {
    expect(recording.request).toEqual(params)
    return recording.reply as {
      data: OpenAI.Images.ImagesResponse
      response: Response
    }
  }

  const { data, response } = await ai.images
    .generate({
      prompt,
      model: 'dall-e-3',
      quality: lowQuality ? 'standard' : 'hd',
      response_format: 'b64_json',
      size,
      style,
    }).withResponse()

  const squeezed = squeezeMockData(data)
  imageMock.store(id, {
    request: params,
    reply: { data: squeezed, response },
  })
  return { data, response }
}

const imageReplySchema = z.object({
  data: z.unknown(),
  response: z.unknown(),
})
const imagePairSchema = z.object({
  request: parameters['image'],
  reply: imageReplySchema,
})

const imageMock = mockCreator(imagePairSchema)
image.mock = imageMock

const completionsReplySchema = z.object({
  assistant: assistantMessage,
  stats: messageStatsSchema,
})

const completionsPairSchema = z.object({
  request: chatParams,
  reply: completionsReplySchema,
})

export const complete = async (
  agent: Agent,
  messages: Thread['messages'],
  api: IA,
) => {
  const tools = await loadTools(agent, api)
  const args = getChatParams(agent, messages, tools)

  const id = printPlain(api.pid)
  const recording = completionsMock.next(id)
  if (recording) {
    expect(recording.request).toEqual(args)
    return recording.reply
  }

  log('completion started with model: %o', args.model, print(api.pid))
  let retries = 0
  const RETRY_LIMIT = 5
  let errorMessage = ''
  while (retries++ < RETRY_LIMIT) {
    try {
      const start = Date.now()
      const { data: completion, response: raw } = await ai.chat
        .completions
        .create(args).withResponse()
      const duration = Date.now() - start
      const openAiProcessingMs = raw.headers.get('openai-processing-ms')
      const { created, model, system_fingerprint, usage } = completion

      const { message } = completion.choices[0]
      log('completion complete', agent.source.path, message)
      const assistant: AssistantMessage = {
        ...message,
        name: agent.source.path,
      }
      const reply = {
        assistant,
        stats: messageStatsSchema.parse({
          created,
          model,
          system_fingerprint,
          usage,
          duration,
          openAiProcessingMs: openAiProcessingMs ? +openAiProcessingMs : 0,
        }),
      }
      completionsMock.store(id, { request: args, reply })

      return reply
    } catch (error) {
      console.error('ai completion error', error)
      if (error instanceof Error) {
        errorMessage = error.message
      }
    }
  }
  throw new Error(`Failed after ${retries} attempts: ${errorMessage}`)
}
const completionsMock = mockCreator(completionsPairSchema)
complete.mock = completionsMock

export const getChatParams = (
  agent: Agent,
  messages: Thread['messages'],
  tools: OpenAI.ChatCompletionTool[],
) => {
  const { config } = agent
  const {
    model,
    temperature,
    tool_choice,
    parallel_tool_calls,
    presence_penalty,
  } = config

  messages = [...messages]
  const sysprompt: CompletionMessage = {
    role: 'system',
    content: agent.instructions,
    name: agent.source.path,
  }
  if (agent.instructions || agent.commands.length || agent.napps.length) {
    messages.push(sysprompt)
  }
  messages = messages.map(safeAssistantName)

  let args: ChatParams = {
    model,
    temperature,
    messages,
    seed: 1337,
    tools: tools.length ? tools : undefined,
    tool_choice: tools.length ? tool_choice : undefined,
    presence_penalty,
    parallel_tool_calls: tools.length ? parallel_tool_calls : undefined,
  }
  args = Object.fromEntries(
    Object.entries(args).filter(([_, value]) => value !== undefined),
  ) as ChatParams
  return args
}
export const safeAssistantName = (message: CompletionMessage) => {
  if (message.role !== 'assistant' && message.role !== 'system') {
    return message
  }
  if (!message.name) {
    return message
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(message.name)) {
    return {
      ...message,
      name: message.name.replaceAll(/[^a-zA-Z0-9_-]/g, '_'),
    }
  }
  return message
}

const squeezeMockData = (result: OpenAI.Images.ImagesResponse) => {
  const fake =
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAABQUlEQVR4nAE2Acn+AFWFasx5BD3kQfuYK9zNJJXzR81JXGsdYwxOP/ggyAQC+dlbzrmdUZ+Xgo9sBhbNytzXE2IPfxblFuNZ9vYCD9Qw+7UUN/xCErc8I0gk21S+uCU4EX33VN1CFz5pAHaODSC/a8ZsheMYxX37BIOoMcfnpS8k6KwY7zE9VgKU4CsTmvjyE8lur1yLUAo7SKUu07rY8zYwmNASNh0CvvWpIaH1bs1V01RZE2se73fmxRfts48N4bf03otfBDHQ3j52DzyUBguaBfEcXnDOsBuN6HeYeMbrXRzVtADOYHNpl5tMMNBP2PSqx3YI7MFiBfb2wXFXAxH0JSsA1ZsAv2N5fzoy1PrKBJ8201yyqOsPZKnyqJ10ME7oAfSuLGJaACH+38rm67hvIcxsB99FWZb3Ah6CMO1CEnIBlb6tLzIdAAAAAElFTkSuQmCC'

  assert(result.data.length, 'data length must be 1')
  const { b64_json: _, ...rest } = result.data[0]
  return {
    ...result,
    data: [{ b64_json: fake, ...rest }],
  }
}
