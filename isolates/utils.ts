import { Functions, toApi, ToApiType } from '@/constants.ts'
import { z } from 'zod'
export const parameters = {
  delay: z.object({
    milliseconds: z.number().int().gte(1).describe(
      'The number of milliseconds to delay the execution of the next command',
    ),
  }).describe(
    'Delays the execution of the next command by the specified number of milliseconds and then returns the current date and time in the format used by the system locale.',
  ),
  resolve: z.object({}).passthrough().describe(
    'Used by drones to signal the successful completion of a task.  Can be called with any properties at all',
  ),
  reject: z.object({}).passthrough().describe(
    'Used by drones to signal the unsuccessful completion of a task.  Can be called with any properties at all',
  ),
}
export const returns = {
  delay: z.string().describe(
    'The current date and time in the format used by the system locale',
  ),
  resolve: z.void(),
  reject: z.void(),
}
export const api = toApi(parameters)
export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  delay: async ({ milliseconds }) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
    return new Date().toLocaleString()
  },
  resolve: () => {
    throw new Error('Resolve should never execute')
  },
  reject: () => {
    throw new Error('Reject should never execute')
  },
}
