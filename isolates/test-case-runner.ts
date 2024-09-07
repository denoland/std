import {
  chatParams,
  Functions,
  getThreadPath,
  IA,
  print,
  Thread,
  type ToApiType,
  withMeta,
} from '@/constants.ts'
import { assert, Debug } from '@utils'
import * as longthread from '@/isolates/longthread.ts'
import { load } from '@/isolates/utils/load-agent.ts'
import { getChatParams } from '@/isolates/ai-completions.ts'
import { loadTools } from './utils/ai-load-tools.ts'
import { addIteration, outcome, testFile } from '@/api/tps-report.ts'
import { z } from 'zod'
import { assistantMessage } from '@/api/zod.ts'

const log = Debug('AI:test-case-runner')

const testParams = z.object({
  path: z.string().regex(/.*\.test\.md$/).describe(
    'the relative path to the test file that contains the test to be run',
  ),
  caseIndex: z.number().int().gte(0)
    .describe('the index of the test case in the containing test file'),
})

export const parameters = {
  test: testParams.describe(
    'Runs the test case at the given index from the given test file.  Returns a list of outcomes from assessing the end system state against the expectations.',
  ),
  caseRunner: testParams.describe(
    'The actual implementation of the test runner.  The test function calls this function in a new branch, and then merges the results back in.',
  ),
  iteration: testParams.extend({
    iterationIndex: z.number().int().gte(0),
  }),
  openai: z.object({
    threadPath: z.string().describe(
      'relative path to the thread to recreate the request response pair from',
    ),
  }).describe(
    'recreates the exact request that was sent to openai for the last request, as well as the response back from openai.  Returns the last request exactly as it was sent to the OpenAI api, and the response from the OpenAI api.',
  ),
  assessment: outcome,
}

export const returns = {
  test: z.void(),
  caseRunner: z.void(),
  iteration: z.void(),
  assessment: z.null(),
  openai: z.object({
    request: chatParams,
    response: assistantMessage,
  }),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  test: async ({ path, caseIndex }, api) => {
    const opts = { branchName: 'case_' + caseIndex }
    const { caseRunner } = await api.actions<Api>('test-case-runner', opts)
    const { parent } = await withMeta(caseRunner({ path, caseIndex }))
    assert(parent, 'missing parent')
    await api.merge(parent)
    // TODO provide feature to read from the commit using the api
  },

  caseRunner: async ({ path, caseIndex }, api) => {
    log('caseRunner', path, caseIndex, print(api.pid))

    const file = await readTpsReport(path, api)
    const { summary: { iterations } } = file

    // TODO handle merging parallel runs back in by reading before and after
    // TODO batch the runs to get around artifact limitations in parallelisms

    for (let i = 0; i < iterations; i++) {
      const opts = { branchName: 'iteration_' + i }
      const { iteration } = await api.actions<Api>('test-case-runner', opts)
      const promise = iteration({ path, caseIndex, iterationIndex: i })
      const { parent } = await withMeta(promise)
      assert(parent, 'missing parent')
      await api.merge(parent)
      log('iteration done', i)
    }
  },
  iteration: async ({ path, caseIndex, iterationIndex }, api) => {
    log('iteration', path, caseIndex, iterationIndex, print(api.pid))

    const tpsReport = await readTpsReport(path, api)
    const { agent, assessor } = tpsReport.summary
    const { prompts, expectations } = tpsReport.cases[caseIndex].summary

    const chain = prompts[iterationIndex % prompts.length]
    if (prompts.length <= iterationIndex) {
      // if we do not have enough prompts to run the iteration, generate more
      // need to get the full test section to use the full context available
      // then run this as a drone
    }
    const actorId = 'iteration_' + iterationIndex
    const { start, run } = await api.functions<longthread.Api>('longthread')
    await start({})
    for (const prompt of chain) {
      await run({ path: agent, content: prompt, actorId })
    }

    log('starting assessment with:', assessor)

    const threadPath = getThreadPath(api.pid)
    const stopOnTools = ['test-case-runner_assessment']
    const { drone } = await api
      .actions<longthread.Api>('longthread', { prefix: 'assess' })

    const promises = expectations.map(async (expectation) => {
      // TODO recreate the call to openai directly
      const content = `threadPath: ${threadPath}\n\nExpectation: ${expectation}`
      const path = assessor
      const result = await drone({ path, content, actorId, stopOnTools })
      assert(result, 'missing result')
      assert(result.functionName === stopOnTools[0], 'unexpected tool call')
      return outcome.parse(result.args)
    })

    const outcomes = await Promise.all(promises)
    const iteration = { prompts: chain, outcomes, commit: api.commit }
    const updated = addIteration(
      tpsReport,
      caseIndex,
      iterationIndex,
      iteration,
    )

    log('writing tps report:', getTpsPath(path))
    api.writeJSON(getTpsPath(path), updated)
  },
  assessment: () => null,
  openai: async ({ threadPath }, api) => {
    const thread = await api.readJSON<Thread>(threadPath)
    const messages = [...thread.messages]
    const response = messages.pop()
    assert(response, 'no messages in thread')
    assert(response.role === 'assistant', 'last message must be assistant')
    const path = response.name
    assert(path, 'path missing from last message')

    const agent = await load(path, api)
    const tools = await loadTools(agent.commands, api)
    const request = getChatParams(agent, messages, tools)
    return { request, response }
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'not .test.md: ' + testPath)
  return testPath.replace('.test.md', '.tps.json')
}
const readTpsReport = async (path: string, api: IA) => {
  const tpsPath = getTpsPath(path)
  return testFile.parse(await api.readJSON(tpsPath))
}
