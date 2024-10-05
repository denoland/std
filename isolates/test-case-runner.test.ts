import { expect, log } from '@utils'
import { type Api } from '@/isolates/test-case-runner.ts'
import { fixture } from '@/tests/fixtures/fixture.ts'
import { TestFile, testFile } from '@/api/tps-report.ts'

Deno.test('test with befores', async (t) => {
  const { backchat, engine } = await fixture()
  // log.enable(
  //   'AI:tests AI:execute-tools AI:agents AI:qbr* AI:test-registry AI:test-controller AI:utils AI:test-case-runner',
  // )
  const tpsReport = testFile.parse(tpsFixture)
  const tpsPath = 'tests/test-fixture.tps.json'
  await backchat.writeJSON(tpsPath, tpsReport)

  const { test } = await backchat.actions<Api>('test-case-runner')

  await t.step('run', async () => {
    const { path } = tpsReport.summary
    await test({ path, caseIndex: 1 })
    const endTps = await backchat.readJSON<TestFile>(tpsPath)

    expect(endTps.cases[1].summary.completed).toBe(1)
    expect(endTps.cases[1].summary.successes).toEqual([1])
  })
  await engine.stop()
})

const tpsFixture: TestFile = {
  summary: {
    timestamp: Date.now(),
    path: 'tests/test-fixture.test.md',
    hash: '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    target: 'agents/agent-fixture.md',
    assessor: 'agents/test-assessor.md',
    elapsed: 1000,
    iterations: 1,
    completed: 0,
  },
  cases: [
    {
      summary: {
        name: 'test name 1',
        timestamp: Date.now(),
        elapsed: 50,
        iterations: 1,
        befores: [],
        prompts: [['call the local function']],
        expectations: ['function was called once'],
        completed: 0,
        successes: [0],
      },
      iterations: [],
    },
    {
      summary: {
        name: 'test name 2',
        timestamp: Date.now(),
        elapsed: 50,
        iterations: 1,
        befores: [0],
        prompts: [['call the local function']],
        expectations: ['function was called twice'],
        completed: 0,
        successes: [0],
      },
      iterations: [],
    },
  ],
}
