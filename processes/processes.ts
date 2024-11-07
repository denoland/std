import { Chalk } from 'chalk'
import { z } from 'zod'
import { assert } from '@std/assert/assert'

export const githubRegex = /^[a-zA-Z\d](?:[a-zA-Z\d]|[-.](?=[a-zA-Z\d])){0,38}$/
export const repoIdRegex = /^rep_[0-9A-HJKMNP-TV-Z]{16}$/

export const pidSchema = z.object({
  /**
   * The hash of the genesis commit is used to identify this repo in a
   * cryptographically secure way.  This repoId is used to reference this repo
   * unique with strong guarantees that this is the correct repo that
   * communication was intended with.
   */
  repoId: z.string().regex(repoIdRegex),
  account: z.string().regex(githubRegex),
  repository: z.string().regex(githubRegex),
  branches: z.array(z.string()).min(1),
})
/**
 * The Process Identifier used to address a specific process branch.
 */
export type PID = z.infer<typeof pidSchema>

export type PartialPID = Omit<PID, 'repoId'>

export const ENTRY_BRANCH = 'main'

export const partialFromRepo = (repo: string) => {
  const [account, repository] = repo.split('/')
  assert(account, 'missing account')
  assert(repository, 'missing repository')
  const pid: PartialPID = {
    account,
    repository,
    branches: [ENTRY_BRANCH],
  }
  return pid
}

export const isPID = (value: unknown): value is PID => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const pid = value as PID
  return (
    typeof pid.account === 'string' &&
    typeof pid.repository === 'string' &&
    Array.isArray(pid.branches) &&
    pid.branches.every((branch) => typeof branch === 'string')
  )
}
const { black, red, green, blue, magenta, cyan, bold } = new Chalk({ level: 1 })
const colors = [red, green, blue, magenta, cyan, black]
let colorIndex = 0
const colorMap = new Map<string, number>()
export const colorize = (
  string: string,
  noSubstring = false,
  noColor = false,
) => {
  let sub = string
  if (!noSubstring) {
    sub = string.substring(0, 7)
  }
  let index
  if (noColor) {
    return sub
  }
  if (colorMap.has(sub)) {
    index = colorMap.get(sub)!
  } else {
    index = colorIndex++
    if (colorIndex === colors.length) {
      colorIndex = 0
    }
    colorMap.set(sub, index)
  }
  const color = colors[index]
  assert(typeof color === 'function', 'color not a function')
  return color(bold(sub))
}
export const print = (pid?: PID, noColor = false) => {
  if (!pid) {
    return '(no pid)'
  }
  const branches = pid.branches.map((segment) => {
    const noSubstring = !segment.startsWith('mac_') &&
      !segment.startsWith('bac_') &&
      !segment.startsWith('act_') &&
      !segment.startsWith('rep_') &&
      !segment.startsWith('the_')
    return colorize(segment, noSubstring, noColor)
  })
  const noSubstring = false
  const repoId = colorize(pid.repoId, noSubstring, noColor)
  return `${repoId}/${pid.account}/${pid.repository}:${branches.join('/')}`
}
export const printPlain = (pid?: PID) => {
  const noColor = true
  return print(pid, noColor)
}
export const freezePid = (pid: PID) => {
  if (!pid.repoId) {
    throw new Error('repoId is required')
  }
  if (!repoIdRegex.test(pid.repoId)) {
    throw new Error('Invalid repoId: ' + pid.repoId)
  }
  if (!pid.account) {
    throw new Error('account is required')
  }
  if (!pid.repository) {
    throw new Error('repository is required')
  }
  if (!pid.branches[0]) {
    throw new Error('branch is required')
  }
  if (!githubRegex.test(pid.account) || !githubRegex.test(pid.repository)) {
    const repo = `${pid.account}/${pid.repository}`
    throw new Error('Invalid GitHub account or repository name: ' + repo)
  }
  Object.freeze(pid)
  Object.freeze(pid.branches)
  return pid
}

export const addBranches = (pid: PID, ...children: string[]) => {
  const next = { ...pid, branches: [...pid.branches, ...children] }
  return freezePid(next)
}
export const addPeer = (pid: PID, peer: string) => {
  const branches = [...pid.branches]
  branches.pop()
  const next = { ...pid, branches: [...branches, peer] }
  return freezePid(next)
}
export const getParent = (pid: PID) => {
  const branches = [...pid.branches]
  branches.pop()
  return freezePid({ ...pid, branches })
}
export const getRoot = (pid: PID) => {
  const root = pid.branches[0]
  assert(root, 'root branch is missing')
  return freezePid({ ...pid, branches: [root] })
}
export const getBaseName = (pid: PID) => {
  return pid.branches[pid.branches.length - 1]
}
export const sha1 = /^[0-9a-f]{40}$/i

import { actionSchema } from '../api/actions.ts'

export const addressedSchema = z.object({
  // what is the addressing ?
  // should this be threading, rather than absolute hash space addressing ?
  // should all network comes go thru a dedicated branch and get re-addressed
  // there ?
  action: actionSchema,
})
export type Addressed = z.infer<typeof addressedSchema>
