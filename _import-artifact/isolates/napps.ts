import { z } from 'zod'
import * as longthread from '@/isolates/longthread.ts'
import {
  Functions,
  getActorId,
  outcomeSchema,
  pidSchema,
  reasoning,
  ToApiType,
} from '@/constants.ts'
import { assert, Debug } from '@utils'

const log = Debug('AI:napps')

export const asyncConfig = z.object({
  /** Run this napp on the current thread */
  inline: z.boolean(),
  /** Wait for the napp to finish rather than immediately returning */
  synchronous: z.boolean(),
  /** Interrupt the calling thread on return, which will trigger a
   * generation of the current agent.  Without this, it will wait until
   * the agent runs again to make it aware of the tool call return */
  interrupt: z.boolean(),
  /** Restart with the same data as the last call to this napp */
  stateful: z.boolean(),
  /** Where to set the virtual root on the filesystem, to restrict what
   * the napp can read and write to */
  chroot: z.string(),
})
// TODO merge in the async config

const summon = z.object({
  reasoning,
  content: z.string(),
  /** Identifying name of the napp to call */
  name: z.string(),
})

export const parameters = {
  /** Call an nApp from inside an llm toolcall where the name of the function
   * call is the name of the isolate  */
  summon: summon.omit({ name: true }),
  /** Call an nApp from inside the executeTools function */
  summonByName: summon,
  /** Call a tool that is exported by a nApp */
  tool: z.object({
    /** Identifying name of the tool exported from the napp to call */
    function: z.string(),
    /** parameters to call the tool with */
    parameters: z.object({}),
    /** Configuration object for running the tool */
    config: z.object({}),
  }),

  /** Retrieve the result of a summon or a tool call */
  retrieve: z.object({ id: z.string() }),
}

// the method of async insertion is that when the napp call finishes, a new
// synthetic tool call is made to retrieve, which pulls in the results if
// foreground is set to true

export const returns = {
  /** the id of the running summon */
  summon: z.void(),
  summonByName: pidSchema,
  /** the id of the running tool */
  tool: z.string(),
  /** retrieve the outcome of a given run */
  retrieve: outcomeSchema,
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  summon() {
    throw new Error('llm tool stub must never be executed')
  },
  async summonByName({ content, name, reasoning }, api) {
    log('nAppCommand', content, name, reasoning)

    // TODO test adding the reasoning to the thread
    // perhaps modify the prompt in a structured way

    const { start, run } = await api.actions<longthread.Api>('longthread')
    await start({})
    const path = `agents/${name}.md`
    const actorId = getActorId(api.pid)
    await run({ path, content, actorId })

    const thread = await api.readThread()
    const last = thread.messages.pop()
    assert(last, 'no messages in thread')
    assert(last.role === 'assistant', 'last message must be assistant')
    assert(last.content, 'last message must have content')
    assert(typeof last.content === 'string', 'content must be string')
    return api.pid
  },
  tool({ function: tool, parameters, config }) {
    log('nAppTool', tool, parameters, config)
    return ''
  },
  retrieve({ id }) {
    log('nAppRetrieve', id)
    return {}
  },
}
