interface SearchArgs {
  query: string
  after?: number
  before?: number
}
interface SearchResult {
  threadId: string
  description: string
  timestamp: number
}
export type Api = {
  search: (params: SearchArgs) => Promise<SearchResult[]>
}
export const functions = {
  search: async ({ query }: SearchArgs, api: Api) => {
    return []
  },
}
export const api = {
  search: {
    type: 'object',
    description: 'Search for threads that can complete the job',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      after: {
        type: 'number',
        description: 'The timestamp to search after',
      },
      before: {
        type: 'number',
        description: 'The timestamp to search before',
      },
    },
    additionalProperties: false,
  },
}
