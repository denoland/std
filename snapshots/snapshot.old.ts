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
const log = Debug('git:fs')

export default class FS {
  /** The oid used as the root git directory */
  get #internalOid() {
    return this.#overwrite || this.oid
  }

  /** @param the new PID to branch into */
  branch(pid: PID) {
    assert(isSameRepo(this.#pid, pid), 'branching into a different repo')
    return new FS(pid, this.oid, this.#db)
  }
  logs(filepath?: string, depth?: number) {
    if (filepath) {
      filepath = refine(filepath)
    }
    if (filepath === '.') {
      filepath = undefined
    }
    return git.log({ ...this.#git, filepath, depth, ref: this.oid })
  }

  async exists(path: string) {
    path = refine(path)
    if (path === '.') {
      return true
    }
    if (this.#deletes.has(path)) {
      return false
    }
    if (this.#upserts.has(path)) {
      return true
    }

    try {
      await this.readOid(path)
      return true
    } catch (error) {
      // TODO move all errors to be FileNotFoundError
      if (
        error instanceof Error && 'code' in error &&
        error.code === 'NotFoundError'
      ) {
        return false
      }
      throw error
    }
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
  delete(path: string) {
    path = refine(path)
    assert(path !== '.', 'cannot delete root')
    // TODO delete a whole directory
    log('delete', path)
    this.#deletes.add(path)
    this.#upserts.delete(path)
  }
  writeJSON(path: string, json: unknown) {
    // TODO store json objects specially, only strinify on commit
    // then broadcast changes as json object purely
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    path = refine(path)
    const string = JSON.stringify(json, null, 2)
    assert(typeof string === 'string', 'stringify failed')
    return this.write(path, string)
  }
  write(path: string, data: string | Uint8Array) {
    path = refine(path)
    assert(path !== '.', 'cannot write to root')
    // TODO ensure cannot write to a directory
    log('write', path, data)
    this.#upserts.set(path, { data })
    this.#deletes.delete(path)
  }
  async readJSON<T>(path: string, commit?: string): Promise<T> {
    assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)
    const data = await this.read(path, commit)
    return JSON.parse(data)
  }
  async read(path: string, commit?: string) {
    const blob = await this.readBinary(path, commit)
    return new TextDecoder().decode(blob)
  }
  async readBinary(path: string, commit?: string): Promise<Uint8Array> {
    path = refine(path)
    log('readBinary', path, commit)

    if (commit) {
      const { blob } = await this.#readBlob(path, commit)
      return blob
    }

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
        const { blob } = await this.#safeReadBlob({ oid })
        return blob
      }
    }
    const { blob } = await this.#readBlob(path)
    return blob
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

  async ls(path: string = '.') {
    path = refine(path)
    // TODO make a streaming version of this for very large dirs
    // TODO handle changes in the directory like deletes and upserts
    log('ls', path)
    const filepath = path === '.' ? undefined : path
    const tree = await this.readTree(filepath)

    tree.sort((a, b) => {
      if (a.type === 'tree' && b.type === 'blob') {
        return -1
      }
      if (a.type === 'blob' && b.type === 'tree') {
        return 1
      }
      if (a.path.startsWith('.') && !b.path.startsWith('.')) {
        return -1
      }
      if (!a.path.startsWith('.') && b.path.startsWith('.')) {
        return 1
      }
      return a.path.localeCompare(b.path)
    })
    return tree.map((entry) => {
      if (entry.type === 'tree') {
        return entry.path + '/'
      }
      assert(entry.type === 'blob', 'entry type not blob: ' + entry.type)
      return entry.path
    })
  }
  async getCommit() {
    const result = await git.readCommit({ ...this.#git, oid: this.oid })
    return result.commit
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
  async isPidExists(pid: PID) {
    // TODO maybe if this gets read, it gets stored in the accumulator
    // store the root head of our repo in the git file structure, used to
    // reference from
    return !!await this.#db.readHead(pid)
  }
  async mv(from: string, to: string) {
    await this.cp(from, to)
    this.delete(from)
  }
  async cp(from: string, to: string) {
    // TODO check using directories
    from = refine(from)
    to = refine(to)
    assert(from !== to, 'source and destination are the same')
    assert(await this.exists(from), 'source does not exist: ' + from)
    assert(!await this.exists(to), 'destination already exists: ' + to)
    const oid = await this.readOid(from)
    this.#upserts.set(to, { oid })
  }
  async overwrite(commit: string, ...ignores: string[]) {
    // TODO allow changes so long as they are in the ignored set
    assert(!this.isChanged, 'Uncommitted changes may be lost')
    assert(sha1.test(commit), 'Commit not SHA-1: ' + commit)
    assert(this.oid !== commit, 'cannot overwrite with same commit')
    assert(
      this.#overwrite !== commit,
      'cannot overwrite the same commit twice',
    )
    ignores.push(IO_PATH)
    ignores.forEach(refine)

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

const isSameRepo = (a: PID, b: PID) => {
  if (a.repoId !== b.repoId) {
    return false
  }
  if (a.account !== b.account) {
    return false
  }
  if (a.repository !== b.repository) {
    return false
  }
  return true
}
