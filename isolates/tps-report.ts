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
    iterations: z.number().int().gte(1).optional(),
  }).describe(
    'Create or update a test report for the given testPath and iterations',
  ),
  addCase: z.object({
    testPath: z.string().describe('the path to the .test.md file'),
    name: z.string().describe('the name of the test case'),
    prompts: z.array(z.array(z.string())).describe(
      'The prompt(s) for the test case.  The outer array is for each iteration, the inner array is for each prompt or chain of prompts',
    ),
    expectations: z.array(z.string()).describe(
      'The expectations for the test case',
    ),
  }).describe(
    'Add a test case to the test report for the given testPath with the given number of expectations',
  ),
}

export const returns: Returns<typeof parameters> = {
  upsert: z.void(),
  addCase: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>
export const api = toApi(parameters)

export const functions: Functions<Api> = {
  upsert: async (
    { testPath, agent, assessor, iterations = 1 },
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
  addCase: async ({ testPath, name, prompts, expectations }, api) => {
    log('addTestCase', testPath, name, expectations)
    const tpsPath = getTpsPath(testPath)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    const updated = tps.addTest(tpsReport, name, prompts, expectations)
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, updated)
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'testPath must end with .test.md')
  return testPath.replace('.test.md', '.tps.json')
}
