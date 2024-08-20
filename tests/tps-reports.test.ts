import {
  addIteration,
  addTest,
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
    casesCount: 1,
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
        expectations: 2,
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
  const suite = testFile.parse(raw)
  expect(suite).toEqual(raw)

  const created = create(
    'tests/test-example.test.md',
    '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    5,
  )
  expect(created.summary.casesCount).toEqual(0)

  const added = addTest(created, 'test name', 2)
  expect(added.summary.casesCount).toEqual(1)
  expect(added.cases.length).toEqual(1)
  expect(added.cases[0].summary.expectations).toEqual(2)

  await delay(1)

  const updated = addIteration(added, 0, {
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
const controller: TestController = {
  globs: ['tests/*.test.md'],
  files: [{ path: 'tests/test-example.test.md', status: 'pending' }],
  concurrency: 2,
}
Deno.test('controller', () => {
  const parsed = testController.parse(controller)
  expect(parsed).toEqual(controller)
})
