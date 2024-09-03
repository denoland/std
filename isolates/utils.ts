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
    'Used by drones to signal the successful completion of a task.  Can be called with any properties at all. MUST BE CALLED ALONE and NEVER in a parallel tool call.',
  ),
  reject: z.object({ message: z.string() }).passthrough().describe(
    'Used by drones to signal the unsuccessful completion of a task.  MUST BE CALLED ALONE and NEVER in a parallel tool call.',
  ),
  time: z.object({}).describe(
    'Returns the current date and time in ISO 8601 format with zero timezone offset',
  ),
}
export const returns = {
  delay: z.string().describe(
    'The current date and time in the format used by the system locale',
  ),
  resolve: z.null(),
  reject: z.null(),
  time: z.string().datetime(),
}
export const api = toApi(parameters)
export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  delay: async ({ milliseconds }) => {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
    return new Date().toLocaleString()
  },
  resolve: () => null,
  reject: () => null,
  time: () => new Date().toISOString(),
}
