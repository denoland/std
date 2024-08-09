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

const log = Debug('AI:synth')

export const api = {
  ls: {
    type: 'object',
    description:
      'list all *.test.md files in a given directory.  Directory must be relative and must end in a "/". Root is ".". ',
    required: ['directory'],
    properties: { directory: { type: 'string' } },
    additionalProperties: false,
  },
  test: {
    type: 'object',
    description:
      'test an agent with a prompt and expectations, given a path to the agent',
    required: ['path', 'prompt', 'assessor', 'expectations'],
    properties: {
      path: {
        type: 'string',
        description: 'the path to the agent file to test',
      },
      prompt: {
        type: 'string',
        description: 'the prompt to drive the agent with',
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
    required: ['reasoning', 'result'],
    properties: {
      reasoning: {
        type: 'array',
        items: { type: 'string' },
      },
      result: { type: 'boolean' },
    },
    additionalProperties: false,
  },
}

export type Api = {
  ls: (params: { directory: string }) => Promise<string[]>
  test: (params: {
    /** Path to the Agent file to invoke */
    path: string
    /** the prompt to drive the agent with */
    prompt: string
    assessor: string
    expectations: string[]
  }) => Promise<{ reasoning: string[]; result: boolean }[]>
  assessment: (params: { reasoning: string[]; result: boolean }) => void
  // addResult: (params: { outcomes: boolean[] }) => void
  // readSummary: () => Promise<string>
}

export const functions: Functions<Api> = {
  ls: async ({ directory }, api) => {
    log('ls', directory, print(api.pid))
    const files = await api.ls(directory)
    return files.filter((file) => file.endsWith('.test.md'))
  },
  test: async ({ path, prompt, assessor, expectations }, api) => {
    log('test', path, prompt, assessor, expectations, print(api.pid))
    const actorId = getActorId(api.pid)

    const { start, run } = await api.actions<longthread.Api>('longthread')
    await start()
    await run({ path, content: prompt, actorId })

    log('starting assessment with:', assessor)

    const thread = await api.readJSON<Thread>(getThreadPath(api.pid))
    const promises = expectations.map(async (expectation) => {
      const { oneshot } = await api.actions<completions.Api>('ai-completions')
      const contents = [
        `Expectation: \n${JSON.stringify(expectation, null, 2)}`,
        '\n---\n',
        `Messages: \n${JSON.stringify(thread.messages, null, 2)}`,
      ]

      const assistant = await oneshot({ path: assessor, contents, actorId })
      assert(assistant.tool_calls?.length === 1, 'expected one tool call')
      const outcome = assistant.tool_calls[0].function
      log('outcome', outcome)
      return JSON.parse(outcome.arguments)
    })
    const outcomes = await Promise.all(promises)
    return outcomes
  },
  assessment: () => {
    throw new Error('Not callable')
  },
  // addResult: ({ outcomes }, api) => {
  // },
}
