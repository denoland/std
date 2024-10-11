import {
  addCase,
  addIteration,
  create,
  type TestController,
  testController,
  type TestFile,
  testFile,
} from '@/api/tps-report.ts'
import { expect } from '@utils'
import { delay } from '@std/async'
const raw: TestFile = {
  summary: {
    timestamp: Date.now(),
    path: 'tests/test-example.test.md',
    hash: '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    target: 'the/agent/to/test.md',
    assessor: 'agents/assessor.md',
    elapsed: 1000,
    iterations: 5,
    completed: 4,
  },
  cases: [
    {
      summary: {
        name: 'test name 1',
        timestamp: Date.now(),
        elapsed: 50,
        iterations: 3,
        dependencies: [],
        promptLists: [['prompt1'], ['multiple prompts', 'prompt2']],
        expectations: ['expectation 1', 'expectation 2'],
        completed: 1,
        successes: [1, 0],
      },
      iterations: [
        {
          commit: '29426920ac614d1672d6f2dfcdd22c0052c22e32',
          prompts: ['prompt used'],
          outcomes: [{
            reasoning: [],
            outcome: true,
          }, {
            reasoning: [],
            outcome: false,
          }],
        },
      ],
    },
  ],
}

Deno.test('tps report', async () => {
  const tpsReport = testFile.parse(raw)
  expect(tpsReport).toEqual(raw)

  const created = create(
    'tests/test-example.test.md',
    'the/agent/to/test.md',
    'agents/assessor.md',
    5,
    '29426920ac614d1672d6f2dfcdd22c0052c22e32',
  )
  expect(created.cases).toHaveLength(0)

  const added = addCase(created, 'test name', [['prompt']], ['e1', 'e2'], [])
  expect(added.cases).toHaveLength(1)
  expect(added.cases[0].summary.expectations).toHaveLength(2)

  await delay(1)

  const updated = addIteration(added, 0, 0, {
    commit: '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    prompts: ['prompt used'],
    outcomes: [{
      reasoning: [],
      outcome: true,
    }, {
      reasoning: [],
      outcome: false,
    }],
  })
  expect(updated.summary.completed).toEqual(1)
  expect(updated.summary.elapsed).toBeGreaterThan(0)
  expect(updated.cases[0].summary.completed).toEqual(1)
  expect(updated.cases[0].summary.elapsed).toBeGreaterThan(0)
})

Deno.test('dependencies', () => {
  let tpsReport = testFile.parse(raw)
  expect(tpsReport).toEqual(raw)

  tpsReport = addCase(tpsReport, 'test name', [['prompt']], ['e1'], [0])
  addCase(tpsReport, 'test name', [['prompt']], ['e1'], [0, 1])
})

const controller: TestController = {
  globs: ['tests/*.test.md'],
  files: [{ path: 'tests/test-example.test.md', status: 'pending' }],
  concurrency: 2,
}
Deno.test('controller', () => {
  const parsed = testController.parse(controller)
  expect(parsed).toEqual(controller)
})
