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
}
export const functions = {
  delay: async (params: { milliseconds: number }) => {
    const { milliseconds } = params
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
    return new Date().toLocaleString()
  },
  relay: () => {
    return '@@ARTIFACT_RELAY@@'
  },
}
