// a git backed implementation of the FS interface
import git, { Errors, type MergeDriverCallback } from 'isomorphic-git'
import http from 'isomorphic-git/http/web/index.js'
import diff3Merge from 'diff3'
import Debug from 'debug'
import { assert } from '@std/assert/assert'
import equal from 'fast-deep-equal'
import * as posix from '@std/path/posix'
import {
  Change,
  ENTRY_BRANCH,
  IO_PATH,
  isBaseRepo,
  PartialPID,
  PID,
  print,
  randomness,
  sha1,
  type TreeEntry,
} from '@/constants.ts'
import type DB from '../engine/db.ts'
import { GitKV } from './git-kv.ts'
const log = Debug('@artifact/git-kv')
const dir = '/'

import type { SnapshotsProvider } from '../snapshots/tip.ts'

export class GitFS implements SnapshotsProvider {
  readonly #oid: string
  readonly #gitkv: GitKV
  readonly #db: DB
  /** If present, the commit oid that overwrote the current FS */
  #overwrite: string | undefined

  private constructor(pid: PID, oid: string, db: DB) {
    assert(sha1.test(oid), 'Commit not SHA-1: ' + oid)
    this.#pid = pid
    this.#oid = oid
    this.#db = db
    this.#gitkv = GitKV.recreate(db, pid)
  }

  static #caches = new Map<string, object>()
  static #getGitCache(pid: PID) {
    if (!FS.#caches.has(pid.repoId)) {
      FS.#caches.set(pid.repoId, {})
    }
    const cache = FS.#caches.get(pid.repoId)
    assert(cache)
    return cache
  }
  static clearCache(pid: PID) {
    FS.#caches.delete(pid.repoId)
  }
  get #git() {
    const cache = FS.#getGitCache(this.#pid)
    return { fs: this.fs, dir, cache }
  }
  get fs() {
    return { promises: this.#gitkv }
  }
  static open(pid: PID, commit: string, db: DB) {
    return new GitFS(pid, commit, db)
  }
  static async openHead(pid: PID, db: DB) {
    const head = await db.readHead(pid)
    if (!head) {
      throw new Error('HEAD not found: ' + print(pid))
    }
    return new GitFS(pid, head, db)
  }
  static async init(partial: PartialPID, db: DB, owner?: PID) {
    const repoId = generateFakeRepoId()
    const pid = { ...partial, repoId }
    const fs = { promises: GitKV.createBlank(db, pid) }
    assert(isBaseRepo(pid), 'not a base repo: ' + print(pid))

    await git.init({ fs, dir, defaultBranch: pid.branches[0] })
    log('init complete')
    const author = { name: owner ? print(owner) : 'git/init' }
    const cache = GitFS.#getGitCache(pid)
    // TODO insert the .io.json file that includes the consensus config
    // TODO write owner into config
    const commit = await git.commit({
      noUpdateBranch: true,
      fs,
      dir,
      message: 'initial commit',
      author,
      cache,
    })
    await db.atomic().createBranch(pid, commit).commit()
    const init = new GitFS(pid, commit, db)
    return init
  }
  static async clone(repo: string, db: DB) {
    // TODO lock the whole repo in case something is running
    // TODO detect the main branch from remote/HEAD
    assert(repo.split('/').length === 2, 'invalid repo: ' + repo)
    const url = `https://github.com/${repo}.git`

    const repoId = generateFakeRepoId()
    const [account, repository] = repo.split('/')
    const pid = { repoId, account, repository, branches: [ENTRY_BRANCH] }
    const fs = { promises: GitKV.createBlank(db, pid) }

    fs.promises.oneAtomicWrite = db.atomic()
    const cache = GitFS.#getGitCache(pid)
    await git.clone({ fs, dir, url, http, noCheckout: true, cache })
    const commit = await db.readHead(pid)
    assert(commit, 'HEAD not found: ' + pid.branches.join('/'))
    const clone = new GitFS(pid, commit, db)
    return clone
  }
  static async fetch(repo: string, pid: PID, db: DB) {
    assert(repo.split('/').length === 2, 'invalid repo: ' + repo)
    const url = `https://github.com/${repo}.git`

    const lockId = await db.lockRepo(pid)
    try {
      const { fs } = await GitFS.openHead(pid, db)
      const cache = GitFS.#getGitCache(pid)
      const result = await git.fetch({ fs, http, dir, url, cache })
      const { fetchHead } = result
      assert(fetchHead, 'fetchHead not found')

      // TODO make release be atomic
      return fetchHead
    } finally {
      await db.releaseRepoLock(pid, lockId)
    }
  }
  static async push(repo: string, pid: PID, db: DB) {
    assert(repo.split('/').length === 2, 'invalid repo: ' + repo)
    const url = `https://github.com/${repo}.git`
    assert(isBaseRepo(pid), 'not a base repo: ' + print(pid))
    const { fs } = await GitFS.openHead(pid, db)
    const cache = GitFS.#getGitCache(pid)
    const result = await git.push({ fs, http, dir, url, cache })
    const { ok } = result
    if (!ok) {
      throw new Error('push failed')
    }
  }
  async writeCommitObject(message = '', parents: string[] = []) {
    assert(this.isChanged, 'empty commit')
    assert(parents.every((oid) => sha1.test(oid)), 'Parent not SHA-1')
    const { oid, changes } = await this.#flush()
    this.#upserts.clear()
    this.#deletes.clear()

    const author = { name: 'git/commit' }
    const nextCommit = await git.commit({
      ...this.#git,
      noUpdateBranch: true,
      message,
      author,
      tree: oid,
      parent: [this.oid, ...parents],
    })
    const { commit } = await git.readCommit({ ...this.#git, oid: nextCommit })

    const next = new FS(this.#pid, nextCommit, this.#db)
    return { next, changes, commit }
  }
  async theirsMerge(theirs: string) {
    const parents = [theirs]
    assert(parents.every((oid) => sha1.test(oid)), 'Parent not SHA-1')
    assert(!this.isChanged, 'cannot merge with changes')
    if (this.oid === theirs) {
      throw new Error('Already merged')
    }
    const author = { name: 'git/theirsMerge' }

    const theirTree = await git.readTree({ ...this.#git, oid: theirs })
    const ourTree = await git.readTree({ ...this.#git, oid: this.oid })

    const io = ourTree.tree.find((entry) => entry.path === IO_PATH)
    const merged = theirTree.tree.filter((entry) => entry.path !== IO_PATH)
    if (io) {
      merged.push(io)
    }
    const tree = await git.writeTree({ ...this.#git, tree: merged })

    const commit = await git.commit({
      ...this.#git,
      noUpdateBranch: true,
      message: 'Merge using "theirs" strategy',
      author,
      tree,
      parent: [this.oid, ...parents],
    })

    const next = new FS(this.#pid, commit, this.#db)
    return { next, changes: {}, commit }
  }
  async merge(commit: string) {
    assert(!this.isChanged, 'cannot merge with changes')
    if (this.oid === commit) {
      return this.oid
    }
    const result = await git.merge({
      ...this.#git,
      noUpdateBranch: true,
      mergeDriver,
      ours: this.oid,
      theirs: commit,
      author: { name: 'Artifact' },
      message: 'Merge',
    })
    assert(result.oid, 'merge failed')
    return result.oid
  }
  async readOid(path: string): Promise<string> {
    // TODO test how this works for "."
    path = refine(path)
    if (this.#deletes.has(path)) {
      throw new Errors.NotFoundError(path)
    }

    const dirname = posix.dirname(path)
    const basename = posix.basename(path)
    const tree = await this.readTree(dirname)
    for (const entry of tree) {
      if (entry.path === basename) {
        return entry.oid
      }
    }
    throw new Errors.NotFoundError(path)
  }
  async readTree(path: string = '.') {
    path = refine(path)
    const oid = this.#internalOid
    const filepath = path === '.' ? undefined : path
    try {
      const { tree } = await git.readTree({ ...this.#git, oid, filepath })
      return tree
    } catch (error) {
      if (
        error instanceof Error && 'code' in error &&
        error.code === 'NotFoundError'
      ) {
        // remove the git commit hash from the error so it is repeatable
        throw new Errors.NotFoundError(path)
      }
      throw error
    }
  }
  async #readBlob(filepath: string, commit?: string) {
    const { blob, oid } = await this.#safeReadBlob({
      oid: commit || this.#internalOid,
      filepath,
    })
    assert(blob instanceof Uint8Array, 'blob not Uint8Array: ' + typeof blob)
    return { blob, oid }
  }
  async #safeReadBlob(params: { oid: string; filepath?: string }) {
    try {
      const { oid, filepath } = params
      return await git.readBlob({ ...this.#git, oid, filepath })
    } catch (error) {
      if (
        error instanceof Error && 'code' in error &&
        error.code === 'NotFoundError'
      ) {
        throw new Errors.NotFoundError(params.filepath || '.')
      }
      throw error
    }
  }
  copyChanges(from: FS) {
    assert(!this.isChanged, 'cannot copy changes to a changed FS')
    assert(equal(this.#pid, from.#pid), 'changes are from different pids')
    for (const path of from.#deletes) {
      this.#deletes.add(path)
    }
    for (const [path, upsert] of from.#upserts) {
      this.#upserts.set(path, upsert)
    }
    this.#overwrite = from.#overwrite
  }

  async #flush() {
    const changes: { [key: string]: Change } = {}
    const oid = this.#internalOid
    const { tree: base } = await git.readTree({ ...this.#git, oid })
    log('flush tree', base)
    const tree: Tree = {
      oid,
      tree: base,
      upserts: new Map(),
      deletes: new Set(),
      children: new Map(),
    }
    for (const [path, upsert] of this.#upserts) {
      let patch: string | undefined
      let blob: Uint8Array
      let oid: string
      if ('data' in upsert) {
        if (typeof upsert.data === 'string') {
          patch = upsert.data
          blob = new TextEncoder().encode(upsert.data)
        } else {
          blob = upsert.data
        }
        oid = await git.writeBlob({ ...this.#git, blob })
      } else {
        oid = upsert.oid
      }
      // TODO parallelize
      log('hash', oid)
      const parent = ensurePath(tree, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      // TODO ignore if already exists
      parent.upserts.set(filename, {
        // https://isomorphic-git.org/docs/en/walk#walkerentry-mode
        mode: '100644',
        path: filename,
        oid,
        type: 'blob',
      })
      changes[path] = { oid, patch }
    }

    for (const path of this.#deletes) {
      log('delete', path)
      const parent = ensurePath(tree, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      parent.deletes.add(filename)
      changes[path] = {}
      // TODO should be able to wipe a whole dir with no effort here
    }

    await retrieveAffectedTrees(tree, this.#git)

    await bubbleChanges(tree, this.#git)

    return { oid: tree.oid, changes }
  }
}

const generateFakeRepoId = () => {
  // TODO make this genuine based on the genesis commit
  return `rep_${randomness()}`
}

const mergeDriver: MergeDriverCallback = ({ contents, path }) => {
  const [baseContent, ourContent, theirContent] = contents
  assert(typeof baseContent === 'string', 'base content not found')
  assert(typeof ourContent === 'string', 'our content not found')
  assert(typeof theirContent === 'string', 'their content not found')

  if (path === IO_PATH) {
    return { cleanMerge: true, mergedText: ourContent }
  }

  const LINEBREAKS = /^.*(\r?\n|$)/gm
  const ours = ourContent.match(LINEBREAKS)
  const base = baseContent.match(LINEBREAKS)
  const theirs = theirContent.match(LINEBREAKS)
  const result = diff3Merge(ours, base, theirs)
  let mergedText = ''
  for (const item of result) {
    if (item.ok) {
      mergedText += item.ok.join('')
    }
    if (item.conflict) {
      mergedText += item.conflict.a.join('')
    }
  }
  return { cleanMerge: true, mergedText }
}

type Tree = {
  oid?: string
  tree?: TreeObject
  upserts: Map<string, TreeEntry>
  deletes: Set<string>
  children: Map<string, Tree>
}
type TreeObject = TreeEntry[]

const ensurePath = (tree: Tree, path: string) => {
  const parts = path.split('/')
  parts.pop()
  let parent = tree
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    let child = parent.children.get(part)
    if (!child) {
      child = {
        upserts: new Map(),
        deletes: new Set(),
        children: new Map(),
      }
      parent.children.set(part, child)
    }
    parent = child
  }
  return parent
}
type Opts = { fs: { promises: GitKV }; cache: object; dir: string }
const retrieveAffectedTrees = async (tree: Tree, opts: Opts) => {
  const promises = []
  if (!tree.tree) {
    assert(tree.oid, 'tree oid not found')
    const result = await git.readTree({ ...opts, oid: tree.oid })
    tree.tree = result.tree
  }
  for (const entry of tree.tree) {
    if (entry.type === 'tree') {
      if (tree.children.has(entry.path)) {
        const child = tree.children.get(entry.path)
        assert(child, 'child not found: ' + entry.path)
        child.oid = entry.oid
        promises.push(retrieveAffectedTrees(child, opts))
      }
    }
  }
  await Promise.all(promises)
}
const bubbleChanges = async (tree: Tree, opts: Opts) => {
  const layers = treeToLayers(tree)
  log('layers', layers)
  while (layers.length) {
    const layer = layers.pop()
    for (const item of layer!) {
      let tree = item.tree || []
      tree = tree.filter((entry) => {
        if (item.upserts.has(entry.path)) {
          return false
        }
        if (item.deletes.has(entry.path)) {
          return false
        }
        if (item.children.has(entry.path)) {
          return false
        }
        return true
      })
      for (const [, entry] of item.upserts) {
        tree.push(entry)
      }
      for (const [path, child] of item.children) {
        assert(child.oid, 'child oid not found: ' + path)
        const entry: TreeEntry = {
          mode: '040000',
          path,
          oid: child.oid,
          type: 'tree',
        }
        tree.push(entry)
      }
      item.oid = await git.writeTree({ ...opts, tree })
      log('write tree', item.oid)
    }
  }
}

const treeToLayers = (tree: Tree, layers: Tree[][] = [], level: number = 0) => {
  if (!layers[level]) {
    layers[level] = []
  }
  layers[level].push(tree)
  for (const child of tree.children.values()) {
    treeToLayers(child, layers, level + 1)
  }
  return layers
}
