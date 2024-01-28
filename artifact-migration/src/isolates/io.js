export const api = {
  relay: {
    description: `Returns the last tool call results and ends the AI conversation.  Useful where one AI is calling another AI and you want to relay the results back to the original caller without consuming any extra tokens or effect from the executing AI.`,
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export const functions = {
  relay: async () => {
    return '@@ARTIFACT_RELAY@@'
  },
}
