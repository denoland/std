import { assert } from '@utils'
import { z } from 'zod'
import { Functions, Returns, toApi, type ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import * as tps from '@/api/tps-report.ts'
import { TestFile } from '@/api/tps-report.ts'

const log = Debug('AI:tps-report')

export const parameters = {
  upsert: z.object({
    testPath: z.string(),
    agent: z.string().describe('the agent that is the target of the test'),
    assessor: z.string().describe('the agent that will assess the test'),
    iterations: z.number().int().gte(1),
  }).describe(
    'Create or update a test report for the given testPath and iterations',
  ),
  addCase: z.object({
    testPath: z.string().describe('the path to the .test.md file'),
    name: z.string().describe('the name of the test case'),
    promptChains: z.array(z.array(z.string())).describe(
      'An array of prompt chains to be used in the test case.  A prompt chain contains one or more prompts that will be executed in sequence.  The array of prompt chains will be used to create variations for the required number of iterations of the test case',
    ),
    expectations: z.array(z.string()).describe(
      'The expectations for the test case',
    ),
  }).describe(
    'Add a test case to the test report for the given testPath with the given number of expectations',
  ),
  confirmCaseCount: z.object({
    testPath: z.string().describe('the path to the .test.md file'),
    reasoning: z.array(z.string()).describe(
      'the reasoning for the test case count',
    ),
    count: z.number().int().gte(1).describe('the number of test cases'),
  }).describe('Confirm the number of test cases in the test report'),
}

export const returns: Returns<typeof parameters> = {
  upsert: z.void(),
  addCase: z.void(),
  confirmCaseCount: z.number().int().gte(0),
}

export type Api = ToApiType<typeof parameters, typeof returns>
export const api = toApi(parameters)

export const functions: Functions<Api> = {
  upsert: async (
    { testPath, agent, assessor, iterations },
    api,
  ) => {
    log('upsertTpsReport', testPath, iterations)
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
  addCase: async ({ testPath, name, promptChains, expectations }, api) => {
    log('addTestCase', testPath, name, expectations)
    const tpsPath = getTpsPath(testPath)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    const updated = tps.addTest(tpsReport, name, promptChains, expectations)
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
    return tpsReport.cases.length
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'testPath must end with .test.md')
  return testPath.replace('.test.md', '.tps.json')
}
