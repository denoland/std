import { IA, PID, pidSchema } from '@/constants.ts'

export const api = {
  ls: {
    type: 'object',
    description: 'List the children of a process',
    properties: {
      pid: pidSchema,
      patterns: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'The patterns to match',
      },
    },
    additionalProperties: false,
  },
}

interface LsArgs {
  pid?: PID
  patterns?: string[]
}
export type Api = {
  ls: ({ pid, patterns }: LsArgs) => Promise<PID[]>
}
export const functions = {
  ls: ({ pid, patterns }: LsArgs, api: IA) => {
    if (!pid) {
      return api.lsChildren(patterns)
    }
    return []
  },
}
