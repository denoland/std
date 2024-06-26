import diff3Merge from 'diff3'
import http from '$git/http/web/index.js'
import * as secp from '@noble/secp256k1'
import { assert, Debug, equal, posix } from '@utils'
import {
  Change,
  ENTRY_BRANCH,
  IO_PATH,
  isBaseRepo,
  isChildOf,
  PartialPID,
  PID,
  print,
  sha1,
} from '@/constants.ts'
import git, { Errors, type MergeDriverCallback } from '$git'
import type DB from '@/db.ts'
import { GitKV } from './gitkv.ts'
const log = Debug('git:fs')
const dir = '/'

type Upsert = { oid: string } | { data: string | Uint8Array }

export default class FS {
  readonly #pid: PID
  readonly #oid: string
  readonly #gitkv: GitKV
  readonly #db: DB
  readonly #upserts = new Map<string, Upsert>()
  readonly #deletes = new Set<string>()
  /** If present, the commit oid that overwrote the current FS */
  #overwrite: string | undefined

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
  get pid() {
    return this.#pid
  }
  /** The oid used as the root git directory */
  get #internalOid() {
    return this.#overwrite || this.oid
  }
  /** The commit oid backing this filesystem */
  get oid() {
    return this.#oid
  }
  get fs() {
    return { promises: this.#gitkv }
  }
  get isChanged() {
    return this.#overwrite || this.#upserts.size > 0 || this.#deletes.size > 0
  }
  get upserts() {
    return [...this.#upserts.keys()]
  }
  get deletes() {
    return [...this.#deletes]
  }
  private constructor(pid: PID, oid: string, db: DB) {
    assert(sha1.test(oid), 'Commit not SHA-1: ' + oid)
    this.#pid = pid
    this.#oid = oid
    this.#db = db
    this.#gitkv = GitKV.recreate(db, pid)
  }
  static open(pid: PID, commit: string, db: DB) {
    return new FS(pid, commit, db)
  }
  static async openHead(pid: PID, db: DB) {
    const head = await db.readHead(pid)
    if (!head) {
      throw new Error('HEAD not found: ' + print(pid))
    }
    return new FS(pid, head, db)
  }
  static async init(partial: PartialPID, db: DB, owner?: PID) {
    const repoId = generateFakeRepoId()
    const pid = { ...partial, repoId }
    const fs = { promises: GitKV.createBlank(db, pid) }
    assert(isBaseRepo(pid), 'not a base repo: ' + print(pid))

    await git.init({ fs, dir, defaultBranch: pid.branches[0] })
    log('init complete')
    const author = { name: owner ? print(owner) : 'git/init' }
    const cache = FS.#getGitCache(pid)
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
    const init = new FS(pid, commit, db)
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
    const cache = FS.#getGitCache(pid)
    await git.clone({ fs, dir, url, http, noCheckout: true, cache })
    const commit = await db.readHead(pid)
    assert(commit, 'HEAD not found: ' + pid.branches.join('/'))
    const clone = new FS(pid, commit, db)
    return clone
  }
  static async fetch(repo: string, pid: PID, db: DB) {
    assert(repo.split('/').length === 2, 'invalid repo: ' + repo)
    const url = `https://github.com/${repo}.git`

    const lockId = await db.lockRepo(pid)
    try {
      const { fs } = await FS.openHead(pid, db)
      const cache = FS.#getGitCache(pid)
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
    const { fs } = await FS.openHead(pid, db)
    const cache = FS.#getGitCache(pid)
    const result = await git.push({ fs, http, dir, url, cache })
    console.log('push result', result)
    const { ok } = result
    if (!ok) {
      throw new Error('push failed')
    }
  }

  tick(commit: string) {
    return new FS(this.#pid, commit, this.#db)
  }
  /** @param the new PID to branch into */
  branch(pid: PID) {
    assert(isChildOf(pid, this.#pid), 'not a child pid')
    return new FS(pid, this.oid, this.#db)
  }
  logs(filepath?: string, depth?: number) {
    if (filepath) {
      assertPath(filepath)
    }
    return git.log({ ...this.#git, filepath, depth, ref: this.oid })
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
  async merge(commit: string) {
    assert(!this.isChanged, 'cannot merge with changes')
    const result = await git.merge({
      ...this.#git,
      noUpdateBranch: true,
      mergeDriver,
      ours: this.oid,
      theirs: commit,
      author: { name: 'git/merge' },
    })
    assert(result.oid, 'merge failed')
    return result.oid
  }
  async exists(path: string) {
    assertPath(path)
    if (this.#deletes.has(path)) {
      return false
    }
    if (this.#upserts.has(path)) {
      return true
    }
    if (path === '.') {
      return true
    }

    try {
      await this.readOid(path)
      return true
    } catch (error) {
      if (error.code === 'NotFoundError') {
        return false
      }
      throw error
    }
  }
  async readOid(path: string): Promise<string> {
    // TODO test how this works for "."
    assertPath(path)
    const dirname = posix.dirname(path)
    const filepath = dirname === '.' ? undefined : dirname
    const basename = posix.basename(path)
    const oid = this.#internalOid
    const { tree } = await git.readTree({ ...this.#git, oid, filepath })
    for (const entry of tree) {
      if (entry.path === basename) {
        return entry.oid
      }
    }
    throw new Errors.NotFoundError(path)
  }
  delete(path: string) {
    assertPath(path)
    // TODO delete a whole directory
    log('delete', path)
    this.#deletes.add(path)
    this.#upserts.delete(path)
  }
  writeJSON(path: string, json: unknown) {
    // TODO store json objects specially, only strinify on commit
    // then broadcast changes as json object purely
    assertPath(path)
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    const string = JSON.stringify(json, null, 2)
    assert(typeof string === 'string', 'stringify failed')
    return this.write(path, string)
  }
  write(path: string, data: string | Uint8Array) {
    assertPath(path)
    log('write', path, data)
    this.#upserts.set(path, { data })
    this.#deletes.delete(path)
  }
  async readJSON<T>(path: string): Promise<T> {
    assertPath(path)
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    const data = await this.read(path)
    return JSON.parse(data)
  }
  async read(path: string) {
    assertPath(path)
    if (this.#upserts.has(path)) {
      const upsert = this.#upserts.get(path)
      assert(upsert, 'upsert not found')
      if ('data' in upsert) {
        if (typeof upsert.data === 'string') {
          return upsert.data
        }
        throw new Error('found binary data, not string')
      }
    }
    const blob = await this.readBinary(path)
    return new TextDecoder().decode(blob)
  }
  async readBinary(path: string): Promise<Uint8Array> {
    assertPath(path)
    log('read', path)
    if (this.#deletes.has(path)) {
      throw new Error('Could not find file or directory: ' + path)
    }
    if (this.#upserts.has(path)) {
      const upsert = this.#upserts.get(path)
      assert(upsert, 'upsert not found')
      if ('data' in upsert) {
        if (typeof upsert.data === 'string') {
          return new TextEncoder().encode(upsert.data)
        }
        return upsert.data
      } else {
        const { oid } = upsert
        const { blob } = await git.readBlob({ ...this.#git, oid })
        return blob
      }
    }
    const { blob } = await this.#readBlob(path)
    return blob
  }
  async #readBlob(path: string) {
    const oid = this.#internalOid
    const { blob, oid: blobOid } = await git.readBlob({
      ...this.#git,
      oid,
      filepath: path,
    })
    assert(blob instanceof Uint8Array, 'blob not Uint8Array: ' + typeof blob)
    return { blob, oid: blobOid }
  }
  async ls(path: string = '.') {
    assertPath(path)
    // TODO make a streaming version of this for very large dirs
    // TODO handle changes in the directory like deletes and upserts
    log('ls', path)
    const oid = this.#internalOid
    const filepath = path === '.' ? undefined : path
    const { tree } = await git.readTree({ ...this.#git, oid, filepath })
    return tree.map((entry) => entry.path)
  }
  async getCommit() {
    const result = await git.readCommit({ ...this.#git, oid: this.oid })
    return result.commit
  }
  copyChanges(from: FS) {
    assert(!this.isChanged, 'cannot copy changes to a changed FS')
    assert(equal(this.#pid, from.#pid), 'changes are from different pids')
    for (const path of from.#deletes) {
      this.delete(path)
    }
    for (const [path, upsert] of from.#upserts) {
      this.#upserts.set(path, upsert)
      this.#deletes.delete(path)
    }
  }
  async isPidExists(pid: PID) {
    return !!await this.#db.readHead(pid)
  }
  async overwrite(commit: string, ...ignores: string[]) {
    // TODO allow changes so long as they are in the ignored set
    assert(!this.isChanged, 'Uncommitted changes present - these may be lost')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    assert(this.oid !== commit, 'cannot overwrite with same commit')
    assert(this.#overwrite !== commit, 'cannot overwrite the same commit twice')
    ignores.push(IO_PATH)
    ignores.forEach(assertPath)

    const result = await git.readCommit({ ...this.#git, oid: commit })
    assert(result, 'commit not found: ' + commit)

    for (const ignore of ignores) {
      if (this.#upserts.has(ignore)) {
        continue
      }
      if (this.#deletes.has(ignore)) {
        continue
      }
      if (await this.exists(ignore)) {
        const oid = await this.readOid(ignore)
        // TODO check if it is unchanged that this is handled
        this.#upserts.set(ignore, { oid })
      } else {
        // TODO check that deleting something not present is handled
        this.#deletes.add(ignore)
      }
    }

    this.#overwrite = commit
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
type Tree = {
  oid?: string
  tree?: TreeObject
  upserts: Map<string, TreeEntry>
  deletes: Set<string>
  children: Map<string, Tree>
}
type TreeObject = TreeEntry[]
type TreeEntry = {
  /**
   * - the 6 digit hexadecimal mode
   */
  mode: string
  /**
   * - the name of the file or directory
   */
  path: string
  /**
   * - the SHA-1 object id of the blob or tree
   */
  oid: string
  /**
   * - the type of object
   */
  type: 'blob' | 'tree' | 'commit'
}
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
const assertPath = (path: string) => {
  assert(path, `path must be relative: ${path}`)
  assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
  assert(path !== '.git', '.git paths are forbidden: ' + path)
  assert(!path.startsWith('.git/'), '.git paths are forbidden: ' + path)
  assert(!path.endsWith('/'), 'path must not end with /: ' + path)
  assert(!path.startsWith('..'), 'path must not start with ..: ' + path)
}

const generateFakeRepoId = () => {
  // TODO make this genuine based on the genesis commit
  const privKey = secp.utils.randomPrivateKey()
  const pubKey = secp.getPublicKey(privKey)
  return secp.etc.bytesToHex(pubKey)
}

const mergeDriver: MergeDriverCallback = ({ contents, path }) => {
  const baseContent = contents[0]
  const ourContent = contents[1]
  const theirContent = contents[2]

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
