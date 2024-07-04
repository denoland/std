export const api = {
  '@@install': {
    type: 'object',
  },
  prompt: {
    description:
      'Send a prompt to the currently focused thread, or if this was a request to backchat, redirect it to the backchat thread.  Note that the currently focused thread could in fact be the backchat thread.',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  upsertThread: {
    description:
      'Create a new thread or resume an existing thread by way of branching with the existing file.  If the agent image is not specified then it will use the configured default agent image.  Any file from anywhere can be used as an image.',
    required: ['agentImage'],
    properties: {
      agent: { type: 'string', minLength: 1, description: 'The n' },
    },
  },
}

const functions = {
  prompt: async (args: { text: string }) => {
    // send the prompt to the current thread
  },
  upsertThread: async (args: { agentImage: string }) => {
    // create a new thread or resume an existing thread
  },
}
