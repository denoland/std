import {
  backchatIdRegex,
  backchatStateSchema,
  Functions,
  generateThreadId,
  getActorId,
  getActorPid,
  IA,
  print,
  threadIdRegex,
  toApi,
  ToApiType,
  unsequencedRequest,
} from '@/constants.ts'
import * as actor from '@/api/isolates/actor.ts'
import { assert, Debug } from '@utils'
import * as longthread from './longthread.ts'
import { z } from 'zod'
const log = Debug('AI:backchat')

export const parameters = {
  create: z.object({}).describe(
    'Create a new thread and set it as the current target thread',
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
  /** The threadId of the new thread */
  create: z.string().regex(threadIdRegex),
  prompt: z.void(),
  relay: z.promise(z.unknown()),
}
export type Api = ToApiType<typeof parameters, typeof returns>

export const api = toApi(parameters)

export const functions: Functions<Api> = {
  create: async (_, api) => {
    log('create', print(api.pid))
    const threadId = generateThreadId(api.commit + 'backchat:create')

    const target = getActorPid(api.pid)
    const { thread } = await api.actions<actor.Api>('actor', { target })
    const pid = await thread({ threadId })
    log('thread started:', print(pid))
    await api.updateState((state) => {
      return { ...state, target: pid }
    }, backchatStateSchema)
    return threadId
  },
  async prompt({ content, attachments }, api) {
    // TODO handle attachments
    log('prompt: %o', content)
    log('threadId: %o attachments: %o', attachments)
    assertBackchatThread(api)
    const actorId = getActorId(api.pid)

    const { target } = await api.state(backchatStateSchema)
    log('base', print(target))

    const { switchboard } = await api.actions<longthread.Api>('longthread', {
      target,
    })
    const agent = switchboard({ content, actorId })
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
