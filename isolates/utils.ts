import { Debug } from '@utils'
import { Functions } from '@/constants.ts'
import * as tps from '@/api/tps-report.ts'
import { assert } from '@std/assert'
import { TestFile } from '@/api/tps-report.ts'

const log = Debug('AI:utils')

export const api = {
  delay: {
    description:
      `Delays the execution of the next command by the specified number of milliseconds and then returns the current date and time in the format used by the system locale.  For example the following function input parameters:
    
      const milliseconds = 1000

      would result in the call:

      await new Promise(resolve => setTimeout(resolve, milliseconds))

      which would delay the execution of the next command by 1 second, and then would return the result of calling:

      new Date().toLocaleString()
      `,
    type: 'object',
    additionalProperties: false,
    required: ['milliseconds'],
    properties: {
      milliseconds: { type: 'integer', minimum: 1 },
    },
  },
  relay: {
    description:
      `Returns the last tool call results and ends the AI conversation.  Useful where one AI is calling another AI and you want to relay the results back to the original caller without consuming any extra tokens or effect from the executing AI.`,
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  trueOrFalse: {
    description:
      `Make a tool call with either true or false as the value.  Used as a way to trigger exit calls from an AI model, rather than relying on text based results which can be unreliable`,
    type: 'object',
    additionalProperties: false,
    required: ['value'],
    properties: {
      value: { type: 'boolean' },
    },
  },
  resolve: {
    type: 'object',
    additionalProperties: true,
    properties: {},
    description:
      'Used by drones to signal the successful completion of a task.  Can be called with any properties at all',
  },
  reject: {
    type: 'object',
    additionalProperties: true,
    properties: {},
    description:
      'Used by drones to signal the unsuccessful completion of a task.  Can be called with any properties at all',
  },
  upsertTpsReport: {
    type: 'object',
    additionalProperties: false,
    required: ['testPath'],
    properties: {
      testPath: { type: 'string' },
      iterations: { type: 'integer' },
    },
    description:
      'Create or update a test report for the given testPath and iterations',
  },
  addTestCase: {
    type: 'object',
    additionalProperties: false,
    required: ['testPath', 'name', 'expectations'],
    properties: {
      testPath: {
        type: 'string',
        description: 'the path to the .test.md file',
      },
      name: { type: 'string', description: 'the name of the test case' },
      expectations: { type: 'integer' },
    },
    description:
      'Add a test case to the test report for the given testPath with the given number of expectations',
  },
}

export type Api = {
  delay: (params: { milliseconds: number }) => Promise<string>
  relay: () => string
  trueOrFalse: (params: { value: boolean }) => void
  resolve: () => void
  reject: () => void
  upsertTpsReport: (params: { testPath: string; iterations?: number }) => void
  addTestCase: (
    params: { testPath: string; name: string; expectations: number },
  ) => void
}
export const functions: Functions<Api> = {
  delay: async ({ milliseconds }) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
    return new Date().toLocaleString()
  },
  relay: () => {
    return '@@ARTIFACT_RELAY@@'
  },
  trueOrFalse: (params: { value: boolean }) => {
    throw new Error('Never execute this function: ' + params.value)
  },
  resolve: () => {
    throw new Error('Resolve should never execute')
  },
  reject: () => {
    throw new Error('Reject should never execute')
  },
  upsertTpsReport: async ({ testPath, iterations = 1 }, api) => {
    log('upsertTpsReport', testPath, iterations)
    const tpsPath = getTpsPath(testPath)
    const hash = await api.readOid(testPath)
    const tpsReport = tps.create(testPath, hash, iterations)
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, tpsReport)
  },
  addTestCase: async ({ testPath, name, expectations }, api) => {
    log('addTestCase', testPath, name, expectations)
    const tpsPath = getTpsPath(testPath)
    const tpsReport = await api.readJSON<TestFile>(tpsPath)
    const updated = tps.addTest(tpsReport, name, expectations)
    log('writing tps report:', tpsPath)
    api.writeJSON(tpsPath, updated)
  },
}

const getTpsPath = (testPath: string) => {
  assert(testPath.endsWith('.test.md'), 'testPath must end with .test.md')
  return testPath.replace('.test.md', '.tps.json')
}
