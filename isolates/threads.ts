import { Functions, IA, print, ToApiType } from '@/constants.ts'
import { log } from '@utils'
import { z } from 'zod'

export const parameters = {
  search: z.object({
    query: z.string().describe('The search query'),
    after: z.number().int().optional().describe(
      'The timestamp to search after',
    ),
    before: z.number().int().optional().describe(
      'The timestamp to search before',
    ),
  }).describe('Search for threads that can complete the job'),
}
export const returns = {
  search: z.array(
    z.object({
      threadId: z.string(),
      description: z.string(),
      timestamp: z.number().int(),
    }),
  ),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  search: ({ query }, api) => {
    log('search', query, print(api.pid))
    return []
  },
}
