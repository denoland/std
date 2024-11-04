import { z } from 'zod'

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

export const generateActorId = () => {
  return 'act_' + randomness()
}

export const getActorId = (source: PID) => {
  const [base, actorId] = source.branches
  const parent = { ...source, branches: [base] }
  const fullHAL = { ...HAL, repoId: source.repoId }
  if (!isPidEqual(parent, fullHAL)) {
    throw new Error('source is not a child of HAL')
  }
  if (!actorIdRegex.test(actorId)) {
    throw new Error('Invalid actor id: ' + actorId)
  }
  return actorId
}
export const getActorPid = (source: PID) => {
  const actorId = getActorId(source)
  const branches = [source.branches[0], actorId]
  return { ...source, branches }
}
export const isActorBranch = (pid: PID) => {
  if (pid.branches.length !== 2) {
    return false
  }
  return !!getActorId(pid)
}

export const actorIdRegex = /^act_[0-9A-HJKMNP-TV-Z]{16}$/
export const backchatIdRegex = /^bac_[0-9A-HJKMNP-TV-Z]{16}$/
export const threadIdRegex = /^the_[0-9A-HJKMNP-TV-Z]{16}$/

export const SU_ACTOR = 'act_0000000000000000'
export const SU_BACKCHAT = 'bac_0000000000000000'
