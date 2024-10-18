import { log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'
import {
  actorId,
  firstTestPath,
  fixture,
  requesterPath,
} from '@/tests/fixtures/fixture.ts'

Deno.test.ignore('test-requester', async (t) => {
  log('test-requester')
  // test interrogating the test suites
  // run multiple test files
  // interrupt a running test
  // be notified when a test completes

  // at the start, can only do full awaiting of the test to complete

  // but now we need to merge back up to parent

  // OR we need to ensure that the controller receives the files from our branch
  await using cradle = await fixture(t, import.meta.url)
  const { backchat } = cradle
  const target = await backchat.threadPID()
  const { run } = await backchat.actions<Api>('longthread', { target })

  // log.enable(
  //   'AI:tests AI:longthread AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller',
  // )
  await t.step('test count', async () => {
    const content = `how many test cases in ./${firstTestPath} ?`
    await run({ content, path: requesterPath, actorId })
  })
  // await t.step('test description', async () => {
  //   const content = `name all the test cases in ./${firstTestPath}`
  //   await actions.run({ content, path: requesterPath, actorId })
  // })
  // await t.step('list all', async () => {
  //   const content = `list all test files in tests/fixtures`
  //   await actions.run({ content, path: requesterPath, actorId })
  // })
  await t.step('run all', async () => {
    const content = `run the first test file in ./tests`
    await run({ content, path: requesterPath, actorId })
  })

  // test running multiple files
  // test summarizing multiple tps reports
})

// first thing to do is generate a full tps report
