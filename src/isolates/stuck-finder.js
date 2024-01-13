import Debug from 'debug'
const debug = Debug('AI:stuck-finder')

export const api = {
  find: {
    type: 'object',
    description:
      'returns an array of objects that represent the solution to the problem.  In each object, there is a "path" key that is used to reference the help, and a "help" object containing the instructions required to solve the problem.  If the array is empty, then no suitable solutions could be found.',
    additionalProperties: false,
    required: ['goal'],
    properties: {
      goal: {
        type: 'string',
        description: 'the goal that the user wants to achieve',
      },
    },
  },
}

export const functions = {
  find: async ({ goal }, config) => {
    debug('goal', goal)
  },
}
