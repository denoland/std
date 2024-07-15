import { executeTools } from './ai-execute-tools.ts'
import { Debug } from '@utils'
import '@std/dotenv/load'
import { IsolateApi, Thread } from '@/constants.ts'
import { Api as Completions } from './ai-completions.ts'
import { Api as Threads } from './thread.ts'

const base = 'AI:runner'
const debugResult = Debug(base + ':ai-result-content')

export type PromptArgs = {
  threadPath: string
  content: string
  userId?: string
}

export const api = {
  run: {
    type: 'object',
    properties: {
      threadPath: { type: 'string' },
      content: { type: 'string' },
      userId: { type: 'string' },
    },
    required: ['threadPath', 'content'],
    additionalProperties: false,
  },
}

export const functions = {
  run: async ({ threadPath, content, userId }: PromptArgs, api: IsolateApi) => {
    const { complete } = await api.actions<Completions>('ai-completions')
    const { addMessage } = await api.actions<Threads>('thread')

    await addMessage({ threadPath, content, userId })
    let result
    do {
      result = await complete({ threadPath })
      if (await isDone(threadPath, api)) {
        return result
      }
      // TODO check tool responses come back correct
      result = await executeTools(threadPath, api)
    } while (!await isDone(threadPath, api))
    return result
  },
}

const isDone = async (threadPath: string, api: IsolateApi) => {
  const thread = await api.readJSON<Thread>(threadPath)
  const assistant = thread.messages[thread.messages.length - 1]
  if (!assistant) {
    return false
  }
  if ('tool_calls' in assistant) {
    return false
  }
  if ('tool_call_id' in assistant) {
    return false
  }
  debugResult(assistant.content || '')
  return true
}
