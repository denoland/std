import { Functions, print, toApi, ToApiType } from '@/constants.ts'
import { Debug } from '@utils'
import { z } from 'zod'
const log = Debug('AI:agents')

export const parameters = {
  search: z.object({ query: z.string() }).describe(
    'The highly descriptive natural language search query saying what the agent you want should be capable of doing.  Will return a ranked array of results, where each result will have a path to the agent file, the name of the agent, and a reason why it was selected, and optionally an avatar representing the agent.',
  ),
  switch: z.object({
    reasoning: z.array(z.string()),
    path: z.string().describe('The path to the agent file to switch to'),
  }).describe(
    'Called with step by step reasoning how the selected path was decided upon, and the path to the new agent to call',
  ),
}
export const returns = {
  search: z.array(
    z.object({
      path: z.string(),
      name: z.string(),
      reason: z.string(),
      imageUrl: z.string().optional(),
    }),
  ),
  switch: z.null(),
}
export const api = toApi(parameters)

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  search: async ({ query }, api) => {
    // TODO make this the same as the files search function

    // read all the agent files in from disk
    // make an AI call to select the best ones and rank them
    // also to provide a reason why they were selected
    // if nothing found or an error, return null

    // this can be an AI call where we force the AI to call the function with
    // something
    // this is just using AI to help do coding tasks, as opposed to agents
    // so agents are defined by their interaction aspect
    // interaction implies state
    log('search', query, print(api.pid))
    const cheapResults = await api.ls('agents')
    return cheapResults.map((path) => ({
      path: `agents/${path}`,
      name: path,
      reason: 'no reason available',
    }))
  },
  switch: ({ path }, api) => {
    log('switch', path, print(api.pid))
    return null
  },
}
