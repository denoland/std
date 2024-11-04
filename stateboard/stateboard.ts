import { z } from 'zod'
import { Debug } from '@utils'
import {
  Functions,
  getThreadPath,
  pidSchema,
  reasoning,
  STATEBOARD_WIDGETS,
  Thread,
} from '@/constants.ts'
import { ToApiType } from '@/constants.ts'
import { assert } from '@std/assert/assert'

const log = Debug('AI:stateboard')

export const parameters = {
  show: z
    .object({
      reasoning,
      pid: pidSchema.optional().describe('defaults to the current pid'),
      commit: z
        .string()
        .optional()
        .describe('the commit to show - defaults to the latest commit'),
      path: z
        .string()
        .optional()
        .describe('the path to show - defaults to "."'),
      // TODO make an allowed list of widgets
      widgets: z.array(STATEBOARD_WIDGETS.describe('the widget to show'))
        .describe(
          'the stack of widgets to display, in the order of their display',
        ),
    })
    .describe(
      'Show the given path with the given widget on the stateboard',
    ),
}
export const returns = {
  show: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  show: async ({ pid, commit, path, widgets }, api) => {
    log('show', pid, commit, path, widgets)
    const threadPath = getThreadPath(api.pid)
    const thread = await api.readThread(threadPath)
    const setter = getLastAssistantMessageId(thread)
    thread.stateboards.push({ commit: api.commit, setter })
    api.writeJSON(threadPath, thread)
  },
}

// ERROR too dependent on openai message structure

function getLastAssistantMessageId(thread: Thread) {
  const messages = [...thread.messages]
  while (messages.length > 0) {
    const message = messages.pop()
    assert(message, 'message should be defined')
    if (message.role === 'assistant') {
      return messages.length + thread.messageOffset
    }
  }
  throw new Error('No assistant message found in thread')
}
