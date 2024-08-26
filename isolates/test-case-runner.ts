import {
  chatParams,
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
import * as loadAgent from '@/isolates/load-agent.ts'
import { getArgs } from '@/isolates/ai-completions.ts'
import { loadTools } from '@/isolates/ai-load-tools.ts'
import { assert } from '@std/assert'
import { addIteration, outcome, TestFile } from '@/api/tps-report.ts'
import { z } from 'zod'
import { assistantMessage } from '@/api/zod.ts'

const log = Debug('AI:test-case-runner')

export const parameters = {
  test: z.object({
    path: z.string().regex(/.*\.test\.md$/).describe(
      'the relative path to the test file that contains the test to be run',
    ),
    index: z.number().int().gte(0)
      .describe('the index of the test case in the containing test file'),
  }).describe(
    'Runs the test case at the given index from the given test file.  Returns a list of outcomes from assessing the end system state against the expectations.',
  ),
  openai: z.object({
    threadPath: z.string().describe(
      'relative path to the thread to recreate the request response pair from',
    ),
  }).describe(
    'recreates the exact request that was sent to openai for the last request, as well as the response back from openai.  Returns the last request exactly as it was sent to the OpenAI api, and the response from the OpenAI api.',
  ),
  assessment: outcome,
}
export const api = toApi(parameters)

export const returns = {
  test: z.void(),
  assessment: z.void(),
  openai: z.object({
    request: chatParams,
    response: assistantMessage,
  }),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  test: async ({ path, index }, api) => {
    log('test', path, index, print(api.pid))
    const actorId = getActorId(api.pid)

    const { start, run } = await api.actions<longthread.Api>('longthread')
    await start({})

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

    const threadPath = getThreadPath(api.pid)
    const stopOnTool = 'test-case-runner_assessment'
    const { drone } = await api
      .actions<longthread.Api>('longthread', { branch: true })

    const promises = expectations.map(async (expectation) => {
      // TODO recreate the call to openai directly
      const content = `threadPath: ${threadPath}\n\nExpectation: ${expectation}`
      const path = assessor
      const assistant = await drone({ path, content, actorId, stopOnTool })

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
  openai: async ({ threadPath }, api) => {
    const thread = await api.readJSON<Thread>(threadPath)
    const messages = [...thread.messages]
    const response = messages.pop()
    assert(response, 'no messages in thread')
    assert(response.role === 'assistant', 'last message must be assistant')
    const path = response.name
    assert(path, 'path missing from last message')

    const { load } = await api.functions<loadAgent.Api>('load-agent')
    const agent = await load({ path })
    const tools = await loadTools(agent.commands, api)
    const request = getArgs(agent, messages, tools)
    return { request, response }
  },
}
const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'not .test.md: ' + testPath)
  return testPath.replace('.test.md', '.tps.json')
}
