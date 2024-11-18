import { assert } from '@utils'
import { z } from 'zod'
import { Functions, reasoning, Returns, type ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import {
  addCase,
  create,
  testCaseSummary,
  testFileSummary,
} from '@/api/tps-report.ts'
import { loadAgent } from '@/isolates/utils/load-agent.ts'

const log = Debug('AI:tps-report')

const caseItem = z.object({ reasoning }).merge(
  testCaseSummary.pick({
    name: true,
    promptLists: true,
    expectations: true,
    dependencies: true,
  }),
).extend({
  dependencies: z.array(z.number().int()).describe(
    testCaseSummary.shape.dependencies.description || '',
  ),
})

// remove restricted schema keywords for structured outputs
const path = z.string().describe(testFileSummary.shape.path.description || '')
const iterations = z
  .number()
  .int()
  .describe(testFileSummary.shape.iterations.description || '')

const upsert = z.object({
  reasoning,
  path,
  target: testFileSummary.shape.target,
  assessor: testFileSummary.shape.assessor,
  iterations,
  cases: z.array(caseItem),
}).describe(
  'Create or update a test report for the given testPath and iterations',
)

export const parameters = { upsert }

export const returns: Returns<typeof parameters> = { upsert: z.void() }

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  upsert: async ({ path, target, assessor, iterations, cases }, api) => {
    log('upsertTpsReport', path, iterations)
    await loadAgent(target, api)
    await loadAgent(assessor, api)
    const tpsPath = getTpsPath(path)
    const hash = await api.readOid(path)
    // TODO use the snapshot it / commit id and filepath.
    let tpsReport = create(path, target, assessor, iterations, hash)

    for (const { name, promptLists, expectations, dependencies } of cases) {
      tpsReport = addCase(
        tpsReport,
        name,
        promptLists,
        expectations,
        dependencies,
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
