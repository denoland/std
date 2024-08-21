import { Functions } from '@/constants.ts'

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
}

export type Api = {
  delay: (params: { milliseconds: number }) => Promise<string>
  relay: () => string
  trueOrFalse: (params: { value: boolean }) => void
  resolve: () => void
  reject: () => void
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
}
