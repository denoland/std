import { z } from 'zod'
import { Functions, toJsonSchema, zodPid } from '@/constants.ts'

export const schema = {
  show: z
    .object({
      pid: zodPid.optional().describe('defaults to the current pid'),
      commit: z
        .string()
        .describe('the commit to show - defaults to the latest commit'),
      path: z
        .string()
        .optional()
        .describe('the path to show - defaults to "."'),
      // TODO make an allowed list of widgets
      widget: z.string(),
    })
    .describe(
      'Show the given path with the given widget on the stateboard',
    ),
}

type FunctionType<T extends Record<string, z.ZodTypeAny>> = {
  [K in keyof T]: (param: z.infer<T[K]>) => void
}

export type Api = FunctionType<typeof schema>
export const api = toJsonSchema(schema)
export const functions: Functions<Api> = {
  show: async ({ pid, commit, path, widget }) => {
    console.log('show', pid, commit, path, widget)
  },
}
