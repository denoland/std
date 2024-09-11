import {
  backchatIdRegex,
  backchatStateSchema,
  Functions,
  generateThreadId,
  getActorId,
  getActorPid,
  getThreadPath,
  IA,
  pidSchema,
  print,
  threadIdRegex,
  threadSchema,
  ToApiType,
  unsequencedRequest,
} from '@/constants.ts'
import * as actor from '@/api/isolates/actor.ts'
import { assert, Debug } from '@utils'
import * as longthread from './longthread.ts'
import { z } from 'zod'
const log = Debug('AI:backchat')

export const parameters = {
  newThreadSignal: z.object({}).describe(
    'Signal to create a new thread and set it as the current target thread',
  ),
  newThread: z.object({}).describe(
    'Create a new thread and set it as the current target thread',
  ),
  changeThreadSignal: pidSchema.describe(
    'Signal to change the current target thread',
  ),
  changeThread: pidSchema.describe('Change the current target thread'),
  changeRemote: z.object({ remote: pidSchema.optional() }).describe(
    'Change the remote of the current target thread',
  ),
  prompt: z.object({
    content: z.string(),
    attachments: z.array(z.string()).optional(),
  }).describe(
    'Send a prompt to the backchat target thread',
  ),
  relay: z.object({
    request: unsequencedRequest,
  }).describe('Relay a request to the given target PID'),
}
export const returns = {
  /** stopOnTool command */
  newThreadSignal: z.null(),
  /** The threadId of the new thread */
  newThread: z.string().regex(threadIdRegex),
  /** stopOnTool command */
  changeThreadSignal: z.null(),
  /** The new target thread */
  changeThread: z.void(),
  /** The new target thread */
  changeRemote: z.void(),
  prompt: z.void(),
  relay: z.unknown(),
}
export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  newThreadSignal: () => null,
  newThread: async (_, api) => {
    log('newThread', print(api.pid))
    const threadId = generateThreadId(api.commit + 'backchat:newThread')

    const target = getActorPid(api.pid)
    const { thread } = await api.actions<actor.Api>('actor', { target })
    const pid = await thread({ threadId })
    log('thread started:', print(pid))
    await api.updateState((state) => {
      return { ...state, target: pid }
    }, backchatStateSchema)
    return threadId
  },
  changeThreadSignal: () => null,
  changeThread: async (target, api) => {
    log('changeThread', print(target))
    const thread = await api.readJSON(getThreadPath(target), { target })
    threadSchema.parse(thread)
    // TODO check other parameters of the thread are suitable as a base target

    await api.updateState((state) => {
      return { ...state, target }
    }, backchatStateSchema)
  },
  changeRemote: async ({ remote }, api) => {
    assertBackchatThread(api)
    log('changeRemote', print(remote))

    const { target } = await api.state(backchatStateSchema)

    const { changeRemote } = await api.actions<longthread.Api>('longthread', {
      target,
    })
    await changeRemote({ remote })
  },
  async prompt({ content, attachments }, api) {
    // TODO handle attachments
    log('prompt: %o', content)
    log('threadId: %o attachments: %o', attachments)
    assertBackchatThread(api)
    const actorId = getActorId(api.pid)

    const { target } = await api.state(backchatStateSchema)
    log('base', print(target))

    // TODO hit this thread with the topic router

    const { switchboard } = await api.actions<longthread.Api>('longthread', {
      target,
    })
    const { newThread, target: next } = await switchboard({ content, actorId })
    if (newThread) {
      await functions.newThread({}, api)
    }
    if (next) {
      await functions.changeThread(next, api)
    }
  },
  relay: ({ request }, api) => {
    // TODO replace this with native relay ability
    return api.action(request)
  },
}
const assertBackchatThread = (api: IA) => {
  assert(api.pid.branches.length === 3, 'Invalid pid')
  return getBackchatId(api)
}
const getBackchatId = (api: IA) => {
  const backchatId = api.pid.branches[2]
  assert(backchatIdRegex.test(backchatId), 'Invalid backchat id')
  return backchatId
}
