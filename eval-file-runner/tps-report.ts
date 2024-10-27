import { md5 } from '../api/types.ts'
import { z } from 'zod'

export const outcome = z
  .object({
    reasoning: z.array(z.string()).describe(
      'the chain of thought reasoning for how the outcome was decided upon',
    ),
    outcome: z.boolean().describe(
      'the outcome of the test iteration, true if the expectation was met, false if it was not',
    ),
    analysis: z.array(z.string()).optional().describe(
      'the step by step analysis of WHY the system prompt of the target agent under test did NOT perform as well in the outcome as it could have',
    ),
    improvements: z.array(z.string()).optional().describe(
      'the improvement(s) to the agent prompt that would have resulted in better performance to reach the outcome',
    ),
  })
  .describe(
    'The assessment outcome of a single test iteration, including reasoning, analysis, and improvements',
  )

export type TestIteration = z.infer<typeof testIteration>
export const testIteration = z
  .object({
    commit: md5.describe('the commit this iteration completed on'),
    prompts: z.array(z.string()).describe('the prompt(s) that were used'),
    outcomes: z.array(outcome).describe('the outcomes of this iteration'),
  })
const summary = z
  .object({
    timestamp: z
      .number()
      .int()
      .gt(1723003530757)
      .default(Date.now)
      .describe('the start time'),
    elapsed: z
      .number()
      .int()
      .gte(0)
      .describe('the time the operation has been running for in ms'),
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

export const testCaseSummary = summary
  .extend({
    name: z.string().describe('the name of the test case'),
    promptLists: z.array(z.array(z.string()))
      .describe('the array of prompt arrays used for each iteration'),
    expectations: z
      .array(z.string())
      .describe('the expectations for this test case'),
    dependencies: z.array(z.number().int().gte(0)).describe(
      'Cases that must be run before this case, to set the starting state',
    ),
    successes: z
      .array(z.number().int().gte(0))
      .describe(
        'for each expectation, the sum of the successful outcomes so far.  When divided by the number of completed iterations, the ratio of successful outcomes is calculated',
      ),
  })
  .strict()
  .describe(
    'A summary of the test results combining all individual results into a ratio',
  )

export type TestCase = z.infer<typeof testCase>
export const testCase = z
  .object({
    summary: testCaseSummary
      .refine((v) => !!v.expectations.length, {
        message: 'expectations must be non-empty',
      })
      .refine((v) => v.completed <= v.iterations, {
        message: 'completed cannot be greater than iterations',
      })
      .refine((v) => v.successes.length === v.expectations.length, {
        message: 'successes length must equal expectations length',
      })
      .refine((v) => v.successes.every((success) => success <= v.completed), {
        message: 'successes cannot be greater than completed',
      }),
    iterations: z.array(testIteration)
      .describe('the outcome and info about each test run that has executed'),
  })
  .strict()
  .describe('summary and runs output of a single test')
  .refine(
    (v) =>
      v.iterations.every((run) =>
        run.outcomes.length === v.summary.expectations.length
      ),
    { message: 'outcomes count must match expectations count' },
  )
  .refine((v) => v.iterations.length <= v.summary.iterations, {
    message: 'runs cannot be greater than iterations',
  })
  .refine((v) => v.iterations.length === v.summary.completed, {
    message: 'runs must equal completed',
  })
  .refine((v) => {
    const tally = v.summary.successes.map(() => 0)
    for (const run of v.iterations) {
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

export const testFileSummary = summary.extend({
  hash: md5
    .describe('the hash of the test file used to generate the test run'),
  path: z.string().regex(/\.test\.md$/)
    .describe('the path to the test file, which must end in .test.md'),
  target: z.string()
    .describe(
      'the path to the target agent file under test, typically something in the agents/ directory',
    ),
  assessor: z.string()
    .describe(
      'the path to the agent file to use to do the assessment of the test outcomes, typically agents/test-assessor.md or something in the agents/ directory',
    ),
})
  .strict()

export type TestFile = z.infer<typeof testFile>
export const testFile = z
  .object({
    summary: testFileSummary
      .refine((value) => value.completed <= value.iterations, {
        message: 'completed cannot be greater than iterations',
      }),
    cases: z.array(testCase).describe('the results of each test case'),
  })
  .strict()
  .refine((v) => {
    let index = 0
    for (const testCase of v.cases) {
      for (const dependency of testCase.summary.dependencies || []) {
        if (dependency >= index) {
          return false
        }
      }
      index++
    }
    return true
  }, { message: '"dependencies" must refer to earlier cases' })

export type TestController = z.infer<typeof testController>
export const testController = z.object({
  globs: z.array(z.string()).default([])
    .describe('the globs to select the files to run'),
  files: z.array(z.object({
    path: z.string(),
    status: z.enum(['pending', 'running', 'complete', 'error']),
  })).describe(
    'the files to run after resolving the globs, in run order, along with their run status',
  ),
  concurrency: z.number().int().gt(0).default(1).describe(
    'the number of files to run concurrently',
  ),
}).strict()

export const create = (
  path: string,
  target: string,
  assessor: string,
  iterations: number,
  hash: string,
) => {
  const blank: TestFile = {
    summary: {
      timestamp: Date.now(),
      path,
      hash,
      target,
      assessor,
      elapsed: 0,
      iterations,
      completed: 0,
    },
    cases: [],
  }
  return testFile.parse(blank)
}

export const addCase = (
  tpsReport: TestFile,
  name: string,
  promptLists: string[][],
  expectations: string[],
  dependencies: number[],
) => {
  const parsed = testFile.parse(tpsReport)
  const test: TestCase = {
    summary: {
      name,
      timestamp: Date.now(),
      elapsed: 0,
      iterations: parsed.summary.iterations,
      promptLists,
      expectations,
      completed: 0,
      successes: Array(expectations.length).fill(0),
      dependencies,
    },
    iterations: [],
  }
  parsed.cases.push(test)
  return testFile.parse(parsed)
}

export const addCaseResult = (
  base: TestFile,
  caseIndex: number,
  caseResult: TestCase,
) => {
  const clean = testFile.parse(base)
  const test = clean.cases[caseIndex]
  if (test.iterations.length) {
    throw new Error('iterations already exist for: ' + caseIndex)
  }
  clean.cases[caseIndex] = caseResult
  return updateSummary(clean)
}

export const addIteration = (
  base: TestFile,
  caseIndex: number,
  iterationIndex: number,
  iteration: TestIteration,
) => {
  const clean = testFile.parse(base)
  const test = clean.cases[caseIndex]
  test.summary.completed++
  test.summary.elapsed = Date.now() - test.summary.timestamp
  iteration.outcomes.forEach(({ outcome }, index) => {
    if (outcome) {
      test.summary.successes[index]++
    }
  })
  if (test.iterations[iterationIndex]) {
    throw new Error('iteration already exists: ' + iterationIndex)
  }
  test.iterations[iterationIndex] = iteration
  return updateSummary(clean)
}

const updateSummary = (tpsReport: TestFile) => {
  let leastCompleted = Number.MAX_SAFE_INTEGER
  for (const test of tpsReport.cases) {
    if (test.summary.completed < leastCompleted) {
      leastCompleted = test.summary.completed
    }
  }
  tpsReport.summary.completed = leastCompleted
  tpsReport.summary.elapsed = Date.now() - tpsReport.summary.timestamp
  return testFile.parse(tpsReport)
}
