import { type TestSuiteSchema, testSuiteSchema } from '@/api/tps-report.ts'
import { expect } from '@utils'
Deno.test('tps report', (t) => {
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
  const suite = testSuiteSchema.parse(raw)
  expect(suite).toEqual(raw)
})
