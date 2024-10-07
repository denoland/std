import { assert } from '@utils'
import { z } from 'zod'
import { Functions, reasoning, Returns, type ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import * as tps from '@/api/tps-report.ts'
import { TestFile, testFileSummary } from '@/api/tps-report.ts'
import { load } from '@/isolates/utils/load-agent.ts'

const log = Debug('AI:tps-report')

const path = z.string().regex(/\.test\.md$/).describe(
  'the path to the .test.md file',
)

const upsert = testFileSummary.pick({
  path: true,
  target: true,
  assessor: true,
  iterations: true,
}).extend({ reasoning }).describe(
  'Create or update a test report for the given testPath and iterations',
)
const addCase = tps.testCaseSummary.pick({
  name: true,
  promptLists: true,
  expectations: true,
  befores: true,
}).extend({ reasoning, path }).describe(
  'Add a test case for the test file located at the given path, with the given number of expectations',
)

export const parameters = {
  upsert,
  addCase,
}

export const returns: Returns<typeof parameters> = {
  upsert: z.void(),
  addCase: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  upsert: async ({ path, target, assessor, iterations }, api) => {
    log('upsertTpsReport', path, iterations)
    await load(target, api)
    await load(assessor, api)
    const tpsPath = getTpsPath(path)
    const hash = await api.readOid(path)
    const tpsReport = tps.create(path, target, assessor, iterations, hash)
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, tpsReport)
  },
  addCase: async ({ path, name, promptLists, expectations, befores }, api) => {
    log('addTestCase', path, name, expectations)
    const tpsPath = getTpsPath(path)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    const updated = tps.addCase(
      tpsReport,
      name,
      promptLists,
      expectations,
      befores,
    )
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, updated)
  },
}

const getTpsPath = (path: string) => {
  assert(path.endsWith('.test.md'), 'testPath must end with .test.md')
  return path.replace('.test.md', '.tps.json')
}
