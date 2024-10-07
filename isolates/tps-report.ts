import { assert } from '@utils'
import { z } from 'zod'
import { Functions, reasoning, Returns, type ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import * as tps from '@/api/tps-report.ts'
import { testFileSummary } from '@/api/tps-report.ts'
import { load } from '@/isolates/utils/load-agent.ts'

const log = Debug('AI:tps-report')

const caseItem = tps.testCaseSummary.pick({
  name: true,
  promptLists: true,
  expectations: true,
  befores: true,
}).extend({ reasoning })

const upsert = testFileSummary.pick({
  path: true,
  target: true,
  assessor: true,
  iterations: true,
}).extend({ reasoning, cases: z.array(caseItem) }).describe(
  'Create or update a test report for the given testPath and iterations',
)

export const parameters = {
  upsert,
}

export const returns: Returns<typeof parameters> = {
  upsert: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  upsert: async ({ path, target, assessor, iterations, cases }, api) => {
    log('upsertTpsReport', path, iterations)
    await load(target, api)
    await load(assessor, api)
    const tpsPath = getTpsPath(path)
    const hash = await api.readOid(path)
    let tpsReport = tps.create(path, target, assessor, iterations, hash)

    for (const { name, promptLists, expectations, befores } of cases) {
      tpsReport = tps.addCase(
        tpsReport,
        name,
        promptLists,
        expectations,
        befores,
      )
    }
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, tpsReport)
  },
}

const getTpsPath = (path: string) => {
  assert(path.endsWith('.test.md'), 'testPath must end with .test.md')
  return path.replace('.test.md', '.tps.json')
}
