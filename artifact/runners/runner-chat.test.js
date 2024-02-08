import Artifact from '../artifact2.ts'
import runner from './runner-chat.js'
import { expect, log } from '../tst-helpers.js'

Deno.test('runner', async (t) => {
  const repo = 'dreamcatcher-tech/HAL'
  const artifact = Artifact.create()
  await artifact.pull({ repo })
  await t.step('load help file', async () => {
    // this should only be able to be called relative to a commit
    // the default is head, but this should not be passed thru to isolates
    const help = await artifact.loadJSON({
      repo,
      path: 'helps/help.fixture.json',
    })
    expect(help).toHaveProperty('instructions')
  })
  await t.step('chat', async () => {
    // need a little wrapper that gives it the isolated functions
    // the runner would typ
    // wrap it in a worker
    // get out the api that it exposed
    // call the function in it ?
    // or wrap it in the engage help isolate, so we haven't poked any holes
    // in the runner
    const worker = await artifact.io.worker('engage-help')
    const invocation = await worker.snapshot(artifact, repo)
    const result = await invocation('engageInBand', {
      help: 'help.fixture',
      text: 'hello',
    })
    log('result', result)
  })
})
