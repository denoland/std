import { z } from 'zod'

const md5 = z.string().regex(/^[a-f0-9]{40}$/, 'Invalid MD5 hash')

const outcome = z
  .object({
    reasoning: z.array(z.string()),
    outcome: z.boolean(),
  })
  .describe(
    'the result of a single test run along with chain of thought reasoning for how the outcome was reached',
  )

type Run = z.infer<typeof run>
const run = z
  .object({
    commit: md5.describe('the commit of the branch this run completed on'),
    prompts: z.array(z.string()).describe('the prompt(s) that were used'),
    outcomes: z.array(outcome).describe('the outcomes of this run'),
  })
const summary = z
  .object({
    timestamp: z
      .number()
      .int()
      .gt(1723003530757)
      .default(Date.now)
      .describe('the time the test run started'),
    elapsed: z
      .number()
      .int()
      .gte(0)
      .describe('the time the test run took to complete in ms'),
    iterations: z
      .number()
      .int()
      .gte(0)
      .describe('the number of planned iterations to run'),
    completed: z
      .number()
      .int()
      .gte(0)
      .default(0)
      .describe(
        'the lowest number of iterations of a test that have completed.  Tests complete asynchronously, so one test might complete all its planned iterations before another test.  The overall progress is based on the lowest number of completed iterations',
      ),
  })
  .describe(
    'A summary of the test results combining all individual results into a ratio',
  )

type SingleTestSchema = z.infer<typeof singleTestSchema>
const singleTestSchema = z
  .object({
    summary: summary
      .extend({
        expectations: z
          .number()
          .int()
          .gt(0)
          .describe('the number of expectations for this run'),
        successes: z
          .array(z.number().int().gte(0))
          .describe(
            'for each expectation, the sum of the successful outcomes so far.  When divided by the number of completed iterations, the ratio of successful outcomes is calculated',
          ),
      })
      .describe(
        'A summary of the test results combining all individual results into a ratio',
      )
      .refine((v) => v.completed <= v.iterations, {
        message: 'completed cannot be greater than iterations',
      })
      .refine((v) => v.successes.length === v.expectations, {
        message: 'successes length must equal expectations count',
      })
      .refine((v) => v.successes.every((success) => success <= v.completed), {
        message: 'successes cannot be greater than completed',
      }),
    runs: z.array(run)
      .describe('the outcome and info about each test run that has executed'),
  })
  .describe('summary and runs output of a single test')
  .refine(
    (v) =>
      v.runs.every((run) => run.outcomes.length === v.summary.expectations),
    { message: 'outcomes count must match expectations count' },
  )
  .refine((v) => v.runs.length <= v.summary.iterations, {
    message: 'runs cannot be greater than iterations',
  })
  .refine((v) => v.runs.length === v.summary.completed, {
    message: 'runs must equal completed',
  })
  .refine((v) => {
    const tally = v.summary.successes.map(() => 0)
    for (const run of v.runs) {
      run.outcomes.forEach(({ outcome }, index) => {
        if (outcome) {
          tally[index]++
        }
      })
    }
    return v.summary.successes.every((success, index) =>
      success === tally[index]
    )
  }, { message: 'runs outcomes must sum to successes' })

export type TestSuiteSchema = z.infer<typeof testSuiteSchema>
export const testSuiteSchema = z
  .object({
    summary: summary.extend({
      hash: md5.describe(
        'the hash of the test file used to generate the test run',
      ),
      path: z.string().describe('the path to the test file'),
      tests: z
        .number()
        .int()
        .gte(0)
        .describe('the number of tests specified in the test file'),
    })
      .refine((value) => value.completed <= value.iterations, {
        message: 'completed cannot be greater than iterations',
      }),
    results: z.array(singleTestSchema).describe('the results of each test'),
  })
  .refine((value) => value.results.length <= value.summary.tests, {
    message: 'the number of tests cannot be less than the number of results',
    path: ['results'],
  })

export const create = (path: string, hash: string, iterations: number) => {
  const blank: TestSuiteSchema = {
    summary: {
      timestamp: Date.now(),
      path,
      hash,
      tests: 0,
      elapsed: 0,
      iterations,
      completed: 0,
    },
    results: [],
  }
  return testSuiteSchema.parse(blank)
}

export const addTest = (base: TestSuiteSchema, expectations: number) => {
  const copy = testSuiteSchema.parse(base)
  const test: SingleTestSchema = {
    summary: {
      timestamp: Date.now(),
      elapsed: 0,
      iterations: copy.summary.iterations,
      expectations,
      completed: 0,
      successes: Array(expectations).fill(0),
    },
    runs: [],
  }
  copy.results.push(test)
  copy.summary.tests++
  return testSuiteSchema.parse(copy)
}

export const addRun = (base: TestSuiteSchema, index: number, run: Run) => {
  const copy = testSuiteSchema.parse(base)
  const test = copy.results[index]
  test.summary.completed++
  test.summary.elapsed = Date.now() - test.summary.timestamp
  run.outcomes.forEach(({ outcome }, index) => {
    if (outcome) {
      test.summary.successes[index]++
    }
  })
  test.runs.push(run)
  let leastCompleted = Number.MAX_SAFE_INTEGER
  for (const _test of copy.results) {
    if (_test.summary.completed < leastCompleted) {
      leastCompleted = _test.summary.completed
    }
  }
  copy.summary.completed = leastCompleted
  copy.summary.elapsed = Date.now() - copy.summary.timestamp
  return testSuiteSchema.parse(copy)
}
