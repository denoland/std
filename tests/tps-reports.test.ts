import {
  addRun,
  addTest,
  create,
  type TestSuiteSchema,
  testSuiteSchema,
} from '@/api/tps-report.ts'
import { expect } from '@utils'
import { delay } from '@std/async'
const raw: TestSuiteSchema = {
  summary: {
    timestamp: Date.now(),
    path: 'tests/test-example.test.md',
    hash: '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    tests: 1,
    elapsed: 1000,
    iterations: 5,
    completed: 4,
  },
  results: [
    {
      summary: {
        timestamp: Date.now(),
        elapsed: 50,
        iterations: 3,
        expectations: 2,
        completed: 1,
        successes: [1, 0],
      },
      runs: [
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
  const suite = testSuiteSchema.parse(raw)
  expect(suite).toEqual(raw)

  const created = create(
    'tests/test-example.test.md',
    '29426920ac614d1672d6f2dfcdd22c0052c22e32',
    5,
  )
  expect(created.summary.tests).toEqual(0)

  const added = addTest(created, 2)
  expect(added.summary.tests).toEqual(1)
  expect(added.results.length).toEqual(1)
  expect(added.results[0].summary.expectations).toEqual(2)

  await delay(1)

  const updated = addRun(added, 0, {
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
  expect(updated.results[0].summary.completed).toEqual(1)
  expect(updated.results[0].summary.elapsed).toBeGreaterThan(0)
})

// verify the synth agent creates the tps report correctly based on the test file
