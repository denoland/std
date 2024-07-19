import { IA, print } from '@/constants.ts'
import { log } from '@utils'

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
  search: ({ query }: SearchArgs, api: IA) => {
    log('search', query, print(api.pid))
    return []
  },
}
/**
 * Search can be just loading up all the threads, grabbing all the messages,
 * stripping out the sysprompt and tool calls, then using context to decided
 * which is better.
 *
 * Or, if we are updating the summary of each thread in the background, just
 * read the summaries and make a decision based on that.
 *
 * Could do batch ranking if things don't fit in the window.
 *
 * Ultimately the thread size and summary, chunks, and topication would be
 * handled inside the thread, each time there is a change to it.
 */
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
