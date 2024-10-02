import { assert } from '@utils'
import { z } from 'zod'
import { Functions, reasoning, Returns, type ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import * as tps from '@/api/tps-report.ts'
import { TestFile } from '@/api/tps-report.ts'
import { load } from '@/isolates/utils/load-agent.ts'

const log = Debug('AI:tps-report')

const testPath = z.string().regex(/\.test\.md$/).describe(
  'the path to the .test.md file',
)
const agent = z.string().regex(/\.md$/).describe(
  'the path to the agent file to use for this job, typically something in the agents/ directory',
)

export const parameters = {
  upsert: z.object({
    reasoning,
    testPath,
    agent,
    assessor: agent,
    iterations: z.number().int().gte(1),
  }).describe(
    'Create or update a test report for the given testPath and iterations',
  ),
  addCase: z.object({
    reasoning,
    testPath,
    name: z.string().describe('the name of the test case'),
    befores: z.array(z.number().int().gte(0)).describe(
      'Test cases that must run before this one, which must all be indices less than this one',
    ),
    chains: z.array(z.array(z.string())).describe(
      'An array of prompt chains to be used in the test case.  A prompt chain contains one or more prompts that will be executed in sequence.  The array of prompt chains will be used to create variations for the required number of iterations of the test case',
    ),
    expectations: z.array(z.string()).describe(
      'The expectations for the test case',
    ),
  }).describe(
    'Add a test case to the test report for the given testPath with the given number of expectations',
  ),
  confirmCaseCount: z.object({
    reasoning: z.array(z.string()).describe(
      'the reasoning for the test case count',
    ),
    testPath: z.string().describe('the path to the .test.md file'),
    count: z.number().int().gte(1).describe('the number of test cases'),
  }).describe(
    'Confirm the number of test cases in the test report.  This function must be called alone and not in parallel.  If the case count is wrong, it will throw an error.  This function is a test to ensure the data in the tps report is so far consistent.',
  ),
}

export const returns: Returns<typeof parameters> = {
  upsert: z.void(),
  addCase: z.void(),
  confirmCaseCount: z.object({ correct: z.boolean() }),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  upsert: async ({ testPath, agent, assessor, iterations }, api) => {
    log('upsertTpsReport', testPath, iterations)
    await load(agent, api)
    await load(assessor, api)
    const tpsPath = getTpsPath(testPath)
    const hash = await api.readOid(testPath)
    const tpsReport = tps.create(
      testPath,
      hash,
      agent,
      assessor,
      iterations,
    )
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, tpsReport)
  },
  addCase: async ({ testPath, name, chains, expectations, befores }, api) => {
    log('addTestCase', testPath, name, expectations)
    const tpsPath = getTpsPath(testPath)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    const updated = tps.addCase(tpsReport, name, chains, expectations, befores)
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, updated)
  },
  confirmCaseCount: async ({ testPath, count, reasoning }, api) => {
    log('confirmCaseCount', testPath, count, reasoning)
    const tpsPath = getTpsPath(testPath)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    if (tpsReport.cases.length !== count) {
      throw new Error('Wrong case count - should be: ' + tpsReport.cases.length)
    }
    return { correct: true }
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'testPath must end with .test.md')
  return testPath.replace('.test.md', '.tps.json')
}
