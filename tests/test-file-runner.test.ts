import { expect, log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'
import {
  actorId,
  fileRunnerPath,
  firstTestPath,
  fixture,
  meetingTestPath,
} from '@/tests/fixtures/fixture.ts'
import * as session from '@/isolates/session.ts'
import { TestFile } from '@/api/tps-report.ts'

Deno.test('test file runner', async (t) => {
  const { backchat, engine } = await fixture()
  log.enable(
    'AI:tests AI:longthread AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
  )
  const { noop } = await backchat.actions<session.Api>('session', {
    branchName: 'runner',
    noClose: true,
  })
  const target = await noop()
  const actions = await backchat.actions<Api>('longthread', { target })

  await t.step('run', async () => {
    await actions.start({})

    const path = fileRunnerPath
    const content = firstTestPath

    await actions.run({ path, content, actorId })

    const tpsPath = firstTestPath.replace('.test.md', '.tps.json')
    const tps = await backchat.readJSON<TestFile>(tpsPath, target)
    console.dir(tps, { depth: 10 })
    log('done', tps)
    expect(tps).toBeTruthy()
    expect(tps.summary.completed).toBe(1)
    expect(tps.cases).toHaveLength(1)
    expect(tps.cases[0].iterations).toHaveLength(1)
    expect(tps.cases[0].iterations[0].outcomes).toHaveLength(4)
  })
  await engine.stop()
})
Deno.test('test meeting bot', async (t) => {
  const { backchat, engine } = await fixture()
  log.enable(
    'AI:tests AI:longthread AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
  )
  const { noop } = await backchat.actions<session.Api>('session', {
    branchName: 'runner',
    noClose: true,
  })
  const target = await noop()
  const actions = await backchat.actions<Api>('longthread', { target })

  await t.step('run', async () => {
    await actions.start({})

    const path = fileRunnerPath
    const content = meetingTestPath

    await actions.run({ path, content, actorId })

    const tpsPath = meetingTestPath.replace('.test.md', '.tps.json')
    const tps = await backchat.readJSON<TestFile>(tpsPath, target)
    console.dir(tps, { depth: 10 })
    log('done', tps)
    expect(tps).toBeTruthy()
    expect(tps.summary.completed).toBe(1)
    expect(tps.cases).toHaveLength(1)
    expect(tps.cases[0].iterations).toHaveLength(1)
    expect(tps.cases[0].iterations[0].outcomes).toHaveLength(1)
  })
  await engine.stop()
})
