import { z } from 'zod'
import { Functions, toApi, WIDGETS, zodPid } from '@/constants.ts'
import { ToApiType } from '@/constants.ts'

export const parameters = {
  show: z
    .object({
      pid: zodPid.optional().describe('defaults to the current pid'),
      commit: z
        .string()
        .optional()
        .describe('the commit to show - defaults to the latest commit'),
      path: z
        .string()
        .optional()
        .describe('the path to show - defaults to "."'),
      // TODO make an allowed list of widgets
      widget: WIDGETS.describe('the widget to show'),
    })
    .describe(
      'Show the given path with the given widget on the stateboard',
    ),
}
export const returns = {
  show: z.void(),
}

export type Api = ToApiType<typeof parameters, typeof returns>
export const api = toApi(parameters)

export const functions: Functions<Api> = {
  show: async ({ pid, commit, path, widget }) => {
    console.log('show', pid, commit, path, widget)
  },
}
