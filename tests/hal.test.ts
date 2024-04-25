import { Engine } from '../engine.ts'
import OpenAI from 'openai'
import { Home } from '@/api/web-client-home.ts'
import { HalBase, HalSession } from '@/isolates/hal.ts'
import { log } from '@utils'
type Messages = OpenAI.ChatCompletionMessageParam

Deno.test('hal', async (t) => {
  const repo = 'dreamcatcher-tech/HAL'
  const engine = await Engine.create()
  await engine.boot()
  const home = Home.create(engine, engine.pid)
  const artifact = await home.createSession()
  const { pid } = await artifact.clone({ repo })

  const halBase = await artifact.actions<HalBase>('hal', pid)
  log.enable('AI:tests AI:hal AI:session AI:isolates:engage-help AI:prompt')
  const halSessionPid = await halBase.createSession()
  const hal = await artifact.actions<HalSession>('hal', halSessionPid)

  // inside, the isolate-api gives back the outcome of the functions we call
  // so we need to change to make actions return the outcome of their calls

  await t.step('prompt', async () => {
    log('pid', halSessionPid)
    await hal.prompt({ text: 'hello' })
    const messages = await artifact.readJSON<Messages[]>(
      'session.json',
      halSessionPid,
    )
    log('messages', messages)
  })
  // the help system should be wrapped up in a top level action - hal()
  // then it can be rewritten / reprovisioned to experiment with new versions

  await artifact.stop()
})

// test rewiring HAL to be something different

// hal could be a router function that reads its instructions from the
// filesystem so that it can be repointed as to where to send the prompts

// the session file format seems like it would be the same.
