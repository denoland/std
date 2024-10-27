import {
  addPeer,
  AssistantMessage,
  chatParams,
  Functions,
  getThreadPath,
  type IA,
  print,
  Thread,
  type ToApiType,
  withMeta,
} from '@/constants.ts'
import { assert, Debug } from '@utils'
import * as session from '@/isolates/session.ts'
import * as longthread from '@/isolates/longthread.ts'
import { loadAgent } from '@/isolates/utils/load-agent.ts'
import { getChatParams } from '@/isolates/ai-completions.ts'
import { loadTools } from '../_import-artifact/isolates/utils/ai-load-tools.ts'
import {
  addCaseResult,
  addIteration,
  outcome,
  testFile,
} from '@/api/tps-report.ts'
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
  test: z.object({
    path: testParams.shape.path,
    cases: z.array(z.number().int().gte(0)).describe(
      'the indices of the test cases to run from the test file',
    ),
  }).describe(
    'Runs the test cases at the given indices from the given test file.  Execution results are stored in the tps file.',
  ),
  caseRunner: testParams.describe(
    'The actual implementation of the test runner.  The test function calls this function in a new branch, and then merges the results back in.',
  ),
  iteration: testParams.extend({ iterationIndex: z.number().int().gte(0) }),
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
  test: async ({ path, cases }, api) => {
    let ours = await readTpsReport(path, api)
    const promises = cases.map(async (caseIndex) => {
      const opts = { branchName: 'case_' + caseIndex }
      const { caseRunner } = await api.actions<Api>('test-case-runner', opts)
      const { parent } = await withMeta(caseRunner({ path, caseIndex }))
      assert(parent, 'missing parent')

      const theirs = await readTpsReport(path, api, parent)
      const caseResult = theirs.cases[caseIndex]
      log('case done', caseIndex)
      return caseResult
    })
    const caseResults = await Promise.all(promises)
    for (const caseIndex of cases) {
      const caseResult = caseResults.shift()
      assert(caseResult, 'missing case result: ' + caseIndex)
      ours = addCaseResult(ours, caseIndex, caseResult)
    }
    api.writeJSON(getTpsPath(path), ours)
  },
  caseRunner: async ({ path, caseIndex }, api) => {
    log('caseRunner', path, caseIndex, print(api.pid))

    const file = await readTpsReport(path, api)
    const { summary: { iterations } } = file
    const testCase = file.cases[caseIndex]
    if (testCase.summary.dependencies.length) {
      await runDependencies(path, testCase.summary.dependencies, api)
    }

    // TODO batch the runs to get around artifact limitations in parallelisms

    // TODO make the iterations all run in parallel

    for (let i = 0; i < iterations; i++) {
      const opts = { branchName: 'iteration_' + i }
      const { iteration } = await api.actions<Api>('test-case-runner', opts)
      // TODO handle nested dependencies
      const promise = iteration({ path, caseIndex, iterationIndex: i })
      const { parent } = await withMeta(promise)
      assert(parent, 'missing parent')

      const theirs = await readTpsReport(path, api, parent)
      const tpsIteration = theirs.cases[caseIndex].iterations[i]
      let ours = await readTpsReport(path, api)
      ours = addIteration(ours, caseIndex, i, tpsIteration)
      api.writeJSON(getTpsPath(path), ours)
      log('iteration done', i)
    }
  },
  iteration: async ({ path, caseIndex, iterationIndex }, api) => {
    log('iteration', path, caseIndex, iterationIndex, print(api.pid))

    const tpsReport = await readTpsReport(path, api)
    const { target, assessor } = tpsReport.summary
    const { promptLists, expectations } = tpsReport.cases[caseIndex].summary

    const chain = promptLists[iterationIndex % promptLists.length]
    if (promptLists.length <= iterationIndex) {
      // if we do not have enough prompts to run the iteration, generate more
      // need to get the full test section to use the full context available
      // then run this as a drone
    }
    const actorId = 'iteration_' + iterationIndex

    const { start, run } = await api.functions<longthread.Api>('longthread')
    const before = addPeer(api.pid, 'before')
    if (await api.exists(getThreadPath(before))) {
      // TODO check this reads in correctly
      await api.cp(getThreadPath(before), getThreadPath(api.pid))
    } else {
      await start({})
    }

    for (const prompt of chain) {
      await run({ path: target, content: prompt, actorId })
    }

    log('starting assessment with:', assessor)

    const threadPath = getThreadPath(api.pid)
    const stopOnTools = ['test-case-runner_assessment']

    const promises = expectations.map(async (expectation, index) => {
      const opts = { branchName: 'assess_' + index }
      const { drone } = await api.actions<longthread.Api>('longthread', opts)
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

    let response: AssistantMessage | undefined
    while (messages.length) {
      const message = messages.pop()
      assert(message, 'message should be defined')
      if (message.role === 'assistant') {
        response = message
        break
      }
    }
    assert(response, 'response not found')

    const path = response.name
    assert(path, 'path missing from last message')

    const agent = await loadAgent(path, api)
    const tools = await loadTools(agent, api)
    const request = getChatParams(agent, messages, tools)
    return { request, response }
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'not .test.md: ' + testPath)
  return testPath.replace('.test.md', '.tps.json')
}
const readTpsReport = async (path: string, api: IA, commit?: string) => {
  const tpsPath = getTpsPath(path)
  return testFile.parse(await api.readJSON(tpsPath, { commit }))
}
const runDependencies = async (
  path: string,
  dependencies: number[],
  api: IA,
) => {
  const noops = { branchName: 'before', noClose: true }
  const { noop } = await api.actions<session.Api>('session', noops)
  const target = await noop({})

  const iters = { target }
  const { iteration } = await api.actions<Api>('test-case-runner', iters)

  let lastParent: string | undefined
  for (const caseIndex of dependencies) {
    // TODO handle nested dependencies
    log('executing dependency:', caseIndex)
    // TODO test this is adding on to the same thread
    const promise = iteration({ path, caseIndex, iterationIndex: 0 })
    const { parent } = await withMeta(promise)
    assert(parent, 'missing parent')
    lastParent = parent

    const tps = await readTpsReport(path, api, parent)
    assert(tps.cases[caseIndex], 'missing case')
    assert(tps.cases[caseIndex].iterations[0], 'missing iteration')
    const { outcomes } = tps.cases[caseIndex].iterations[0]

    const failures = outcomes.filter(({ outcome }) => !outcome)
    if (failures.length) {
      throw new Error('dependencies step failed: ' + JSON.stringify(failures))
    }
  }
  assert(lastParent, 'missing last parent')
  await api.merge(lastParent)
}
