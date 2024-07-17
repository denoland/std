import { IA } from '@/constants.ts'

export const api = {
  search: {
    type: 'object',
    description: 'Search for agents that can complete the job',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    additionalProperties: false,
  },
}
interface SearchArgs {
  query: string
}
interface SearchResult {
  path: string
  name: string
  reason: string
  imageUrl?: string
}
export type Api = {
  search: (params: SearchArgs) => Promise<SearchResult[]>
}

export const functions = {
  search: async ({ query }: SearchArgs, api: IA) => {
    // read all the agent files in from disk
    // make an AI call to select the best ones and rank them
    // also to provide a reason why they were selected
    // if nothing found or an error, return null

    // this can be an AI call where we force the AI to call the function with
    // something
    // this is just using AI to help do coding tasks, as opposed to agents
    // so agents are defined by their interaction aspect
    // interaction implies state
    return []
  },
}
