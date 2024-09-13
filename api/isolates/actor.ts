import { z } from 'zod'
import {
  backchatIdRegex,
  jsonSchema,
  machineIdRegex,
  md5,
  pidSchema,
  threadIdRegex,
  ToApiType,
} from '../types.ts'

const repoParams = z.object({
  repo: z.string(),
  isolate: z.string().optional(),
  params: z.record(jsonSchema).optional(),
})
const repoResult = z.object({
  pid: pidSchema,
  head: md5,
})

export const parameters = {
  backchat: z.object({
    backchatId: z.string().regex(backchatIdRegex),
    machineId: z.string().regex(machineIdRegex).optional(),
  }).describe(
    'Create a new backchat branch.  Optionally if machineId is given, will add to the actors list of machines, which is used during createActor function',
  ),
  thread: z.object({ threadId: z.string().regex(threadIdRegex) }),
  init: repoParams,
  clone: repoParams.describe(
    'Clones from github, using the github PAT (if any) for the calling machine. Updates the branch state in the actor branch to store the PID of the clone.',
  ),
  rm: z.object({
    repo: z.string().optional(),
    all: z.boolean().optional().describe('remove all repos for this actor'),
  }).refine((p) => p.repo || p.all, {
    message: 'must specify repo or all',
  }),
  lsRepos: z.object({}).describe(
    'List all the repos that this Actor has created',
  ),
  pull: z.object({
    repo: z.string(),
    target: pidSchema.optional(),
  }),
}

export const returns = {
  backchat: pidSchema,
  thread: pidSchema,
  init: repoResult,
  clone: repoResult,
  rm: z.object({ reposDeleted: z.number() }),
  lsRepos: z.array(z.string()),
  pull: repoResult,
}
export type Api = ToApiType<typeof parameters, typeof returns>
