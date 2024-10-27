import { z } from 'zod'
import * as backchat from '../_import-artifact/isolates/backchat.ts'
import * as longthread from '../_import-artifact/isolates/longthread.ts'
import * as system from '../_import-artifact/isolates/system.ts'
import {
  addBranches,
  Functions,
  getParent,
  type IA,
  isActorBranch,
  machineIdRegex,
  pidSchema,
  print,
  RpcOpts,
} from '@/constants.ts'
import * as actor from '@/api/isolates/actor.ts'
import { assert, Debug, equal } from '@utils'

const log = Debug('AI:actor')

export const parameters = actor.parameters
export const returns = actor.returns

export const functions: Functions<actor.Api> = {
  async backchat({ backchatId, machineId }, api) {
    assert(isActorBranch(api.pid), 'Not actor branch: ' + print(api.pid))

    log('backchat', print(api.pid))
    const isNewActor = !!machineId
    if (isNewActor) {
      await api.updateState(() => {
        return { machines: { [machineId]: { access: [] } }, repos: {} }
      }, stateSchema)
    }
    const opts: RpcOpts = {
      noClose: true,
      branchName: backchatId,
    }

    const { mergeInternal } = await api.actions<system.Api>('system')
    const from = getParent(api.pid)
    const { elapsed } = await mergeInternal({ from, to: api.pid })
    log('mergeInternal lasted', elapsed)

    const { newThread } = await api.actions<backchat.Api>('backchat', opts)
    // TODO set permissions on .io.json
    await newThread({})
    // TODO optionally start a default thread
    const pid = addBranches(api.pid, backchatId)
    log('backchat pid', print(pid))
    return pid
  },
  async thread({ threadId }, api) {
    const opts = { branchName: threadId, noClose: true }
    const actions = await api.actions<longthread.Api>('longthread', opts)
    await actions.start({})
    return addBranches(api.pid, threadId)
  },
  rm: async ({ repo, all = false }, api) => {
    assert(isActorBranch(api.pid), 'rm not actor: ' + print(api.pid))
    log('rm', repo, all)

    const { rm } = await api.actions<system.Api>('system')
    const state = await api.state(stateSchema, bare)
    if (all) {
      const promises = []
      for (const repo in state.repos) {
        promises.push(rm({ pid: state.repos[repo] }))
      }
      await Promise.all(promises)
      await api.updateState(
        ({ machines, repos }) => {
          assert(equal(state.repos, repos), 'repos changed')
          return { machines, repos: {} }
        },
        stateSchema,
      )
      return { reposDeleted: promises.length }
    }
    assert(repo, 'must specify repo or all')
    if (!(repo in state.repos)) {
      return { reposDeleted: 0 }
    }
    const pid = state.repos[repo]
    log('rm', repo, print(pid), all)

    await rm({ pid })
    await api.updateState(({ machines, repos }) => {
      assert(equal(state.repos, repos), 'repos changed')
      delete repos[repo]
      return { machines, repos }
    }, stateSchema)
    return { reposDeleted: 1 }
  },
  lsRepos: async (_, api) => {
    assert(isActorBranch(api.pid), 'lsRepos not actor: ' + print(api.pid))
    const { repos } = await api.state(stateSchema, bare)
    return Object.keys(repos)
  },
  clone: async ({ repo, isolate, params }, api) => {
    assert(isActorBranch(api.pid), 'clone not actor: ' + print(api.pid))
    log('clone', repo, isolate, params)

    await assertNoRepo(api, repo)

    const { clone } = await api.actions<system.Api>('system')
    const result = await clone({ repo, isolate, params })
    log('clone result', print(result.pid))

    log('state', await api.state(stateSchema, bare))

    await api.updateState(({ machines, repos }) => {
      assert(!repos[repo], 'repos changed: ' + repo)
      repos[repo] = result.pid
      return { machines, repos }
    }, stateSchema)
    log('state', await api.state(stateSchema, bare))
    return result
  },
  init: async ({ repo, isolate, params }, api) => {
    assert(isActorBranch(api.pid), 'init not actor: ' + print(api.pid))
    log('init', repo, isolate, params)

    await assertNoRepo(api, repo)

    const { init } = await api.actions<system.Api>('system')
    const { pid, head } = await init({ repo, isolate, params })

    await api.updateState(({ machines, repos }) => {
      assert(!repos[repo], 'repos changed: ' + repo)
      repos[repo] = pid
      return { machines, repos }
    }, stateSchema)
    return { pid, head }
  },
  pull: async ({ repo, target }, api) => {
    assert(isActorBranch(api.pid), 'pull not actor: ' + print(api.pid))
    log('pull', repo, print(target))
    target = target || api.pid

    const { pull } = await api.actions<system.Api>('system')
    const { head, elapsed } = await pull({ repo, target })
    return { head, elapsed, pid: target }
  },
}
const assertNoRepo = async (api: IA, repo: string) => {
  const state = await api.state(stateSchema, bare)
  if (repo in state.repos) {
    throw new Error('Repo already exists: ' + repo)
  }
}

const stateSchema = z.object({
  repos: z.record(pidSchema),
  machines: z.record(
    z.string().regex(machineIdRegex),
    z.object({
      /** Log when a machine does something */
      access: z.array(z.string()),
    }),
  ),
})

const bare = { repos: {}, machines: {} }
