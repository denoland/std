import {
  Functions,
  getActorId,
  getThreadPath,
  print,
  Thread,
} from '@/constants.ts'
import { Debug } from '@utils'
import * as longthread from '@/isolates/longthread.ts'
import * as completions from '@/isolates/ai-completions.ts'
import { assert } from '@std/assert'
import { addIteration, outcome, TestFile } from '@/api/tps-report.ts'

const log = Debug('AI:test-case-runner')

export const api = {
  test: {
    type: 'object',
    description:
      'test an agent with a prompt and expectations, given a path to the agent.  Returns a list of outcomes from running the prompt and testing the output against the expectations.',
    required: ['path', 'index', 'agent', 'prompts', 'assessor', 'expectations'],

    // convert this to make the file runner add all the test cases first, then
    // just drive the iterations ?
    // then read all we need from the tps report, including the expectations
    // so if expectations were just written, we need no more NL tooling ?
    // could also do variation calculation in this isolate

    // if we made the case format contain everything needed to do variations and
    // write to the tps report, then the tps report can serve as an
    // instructional piece too

    properties: {
      path: {
        type: 'string',
        description: 'the path to the test file being run',
      },
      index: {
        type: 'integer',
        description: 'the index of the test case in the containing test file',
      },
      agent: {
        type: 'string',
        description: 'the path to the agent file to invoke',
      },
      prompts: {
        type: 'array',
        description: 'the prompt(s) to drive the agent with',
        items: { type: 'string' },
      },
      assessor: {
        type: 'string',
        description:
          'the path to the agent file that will be used to assess the expectations against the end state of the system',
      },
      expectations: {
        type: 'array',
        items: { type: 'string' },
        description:
          'the expectations of the end state of the system after the agent has finished, that will be assessed by the assessor agent',
      },
    },
    additionalProperties: false,
  },
  assessment: {
    type: 'object',
    description:
      'Called by the assistant and intercepted before execution.  Reports the outcomes of a test assessment, in the order that the expectations were passed in.  Provides step by step reasoning how the outcome was reached.',
    required: ['reasoning', 'outcome'],
    properties: {
      reasoning: {
        type: 'array',
        items: { type: 'string' },
      },
      outcome: { type: 'boolean' },
    },
    additionalProperties: false,
  },
}

export type Api = {
  /** Runs a single test case and assesses the output against the expectations  */
  test: (params: {
    /** Path to the test file this test case is from */
    path: string
    /** index of the test case in the containing test file */
    index: number
    /** Path to the Agent file to invoke */
    agent: string
    /** the prompt(s) to drive the agent with */
    prompts: string[]
    assessor: string
    expectations: string[]
  }) => Promise<void>
  assessment: (params: { reasoning: string[]; outcome: boolean }) => void
}

export const functions: Functions<Api> = {
  test: async (
    { path, index, agent, prompts, assessor, expectations },
    api,
  ) => {
    log('test', path, index, prompts, assessor, expectations, print(api.pid))
    const actorId = getActorId(api.pid)

    const { start, run } = await api.actions<longthread.Api>('longthread')
    await start()
    for (const prompt of prompts) {
      await run({ path: agent, content: prompt, actorId })
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
    const tpsReport = await api.readJSON<TestFile>(getTpsPath(path))
    const iteration = { commit: api.commit, outcomes, prompts }
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
