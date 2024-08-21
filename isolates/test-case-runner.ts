import {
  Functions,
  getActorId,
  getThreadPath,
  print,
  Thread,
  toApi,
  type ToApiType,
} from '@/constants.ts'
import { Debug } from '@utils'
import * as longthread from '@/isolates/longthread.ts'
import * as completions from '@/isolates/ai-completions.ts'
import { assert } from '@std/assert'
import { addIteration, outcome, TestFile } from '@/api/tps-report.ts'
import { z } from 'zod'

const log = Debug('AI:test-case-runner')

export const parameters = {
  test: z.object({
    path: z.string().describe('the path to the test file being run'),
    index: z.number().int().gte(0)
      .describe('the index of the test case in the containing test file'),
  }).describe(
    'Runs the test case at the given index from the given test file.  Returns a list of outcomes from assessing the end system state against the expectations.',
  ),
  assessment: z.object({
    reasoning: z.array(z.string()),
    outcome: z.boolean(),
  }).describe(
    'Called by the assistant and intercepted before execution.  Reports the outcomes of a test assessment, in the order that the expectations were passed in.  Provides step by step reasoning how the outcome was reached.',
  ),
}
export const api = toApi(parameters)

export const returns = {
  test: z.void(),
  assessment: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  test: async ({ path, index }, api) => {
    log('test', path, index, print(api.pid))
    const actorId = getActorId(api.pid)

    const { start, run } = await api.actions<longthread.Api>('longthread')
    await start()

    const tpsPath = getTpsPath(path)
    let tpsReport = await api.readJSON<TestFile>(tpsPath)
    const { agent, assessor } = tpsReport.summary
    const { prompts, expectations } = tpsReport.cases[index].summary

    for (const chain of prompts) {
      // TODO treat each chat as an iteration to be done in parallel
      // related to how many iterations we want to run
      // so include the variation generation feature
      for (const prompt of chain) {
        await run({ path: agent, content: prompt, actorId })
      }
    }

    log('starting assessment with:', assessor)

    const thread = await api.readJSON<Thread>(getThreadPath(api.pid))
    const { oneshot } = await api
      .actions<completions.Api>('ai-completions', { branch: true })
    const promises = expectations.map(async (expectation) => {
      const contents = [
        `Expectation: \n${expectation}`,
        '\n---\n',
        `Messages: \n${JSON.stringify(thread.messages, null, 2)}`,
      ]
      const assistant = await oneshot({ path: assessor, contents, actorId })

      assert(assistant.tool_calls?.length === 1, 'expected one tool call')
      const args = JSON.parse(assistant.tool_calls[0].function.arguments)
      log('outcome', args)
      const clean = outcome.parse(args)
      return clean
    })

    const outcomes = await Promise.all(promises)
    tpsReport = await api.readJSON<TestFile>(getTpsPath(path))
    const iteration = { commit: api.commit, outcomes, prompts: prompts[0] }
    const updated = addIteration(tpsReport, index, iteration)

    log('writing tps report:', getTpsPath(path))
    api.writeJSON(getTpsPath(path), updated)
  },
  assessment: () => {
    throw new Error('Not callable')
  },
}
const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'testPath must end with .test.md')
  return testPath.replace('.test.md', '.tps.json')
}
