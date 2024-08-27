import { expect, log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'
import {
  actorId,
  fileRunnerPath,
  firstTestPath,
  fixture,
  meetingTestPath,
} from '@/tests/fixtures/fixture.ts'
import { TestFile } from '@/api/tps-report.ts'
import { addBranches } from '@/constants.ts'

Deno.test('test file runner', async (t) => {
  const { backchat, engine } = await fixture()
  log.enable(
    'AI:tests AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
  )

  const opts = { branchName: 'runner', noClose: true }
  const { drone } = await backchat.actions<Api>('longthread', opts)
  const target = addBranches(backchat.pid, opts.branchName)

  await t.step('run', async () => {
    const path = fileRunnerPath
    const content = firstTestPath

    await drone({ path, content, actorId })

    const tpsPath = firstTestPath.replace('.test.md', '.tps.json')
    const tps = await backchat.readJSON<TestFile>(tpsPath, target)
    log('done', tps)
    expect(tps).toBeTruthy()
    expect(tps.summary.completed).toBe(2)
    expect(tps.cases).toHaveLength(1)
    expect(tps.cases[0].iterations).toHaveLength(2)
    expect(tps.cases[0].iterations[0].outcomes).toHaveLength(4)
    expect(tps.cases[0].iterations[1].outcomes).toHaveLength(4)
  })
  await engine.stop()
})
Deno.test('test meeting bot', async (t) => {
  const { backchat, engine } = await fixture()
  log.enable(
    'AI:tests AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
  )
  const opts = { branchName: 'runner', noClose: true }
  const { drone } = await backchat.actions<Api>('longthread', opts)
  const target = addBranches(backchat.pid, opts.branchName)

  await t.step('run', async () => {
    const path = fileRunnerPath
    const content = meetingTestPath

    await drone({ path, content, actorId })

    const tpsPath = meetingTestPath.replace('.test.md', '.tps.json')
    const tps = await backchat.readJSON<TestFile>(tpsPath, target)
    log('done', tps)
    expect(tps).toBeTruthy()
    expect(tps.summary.completed).toBe(1)
    expect(tps.cases).toHaveLength(1)
    expect(tps.cases[0].iterations).toHaveLength(1)
    expect(tps.cases[0].iterations[0].outcomes).toHaveLength(1)
  })
  await engine.stop()
})
