import { assert, Debug, posix } from '@utils'
import { ENTRY_BRANCH, PID } from '@/constants.ts'
import git from '$git'
import { pidFromRepo } from '@/keys.ts'
import type DB from '@/db.ts'
import { GitKV } from './gitkv.ts'
const log = Debug('AI:git:fs')
const dir = '/'
const sha1Regex = /^[0-9a-f]{40}$/i

export default class FS {
  // pass this object around, and set it to be a particular PID
  #pid: PID
  #commit: string
  #gitkv: GitKV
  #db: DB
  #cache = {}
  private constructor(pid: PID, commit: string, db: DB) {
    assert(sha1Regex.test(commit), 'Commit not SHA-1: ' + commit)
    this.#pid = pid
    this.#commit = commit
    this.#db = db
    this.#gitkv = new GitKV(db, pid)
  }
  static open(pid: PID, commit: string, db: DB) {
    return new FS(pid, commit, db)
  }
  static async init(repo: string, db: DB) {
    // check this is a base branch, not a nested ?
    // or that it must be a repo.  Will return an fs object with a commit
    const pid = pidFromRepo(repo)
    const fs = { promises: new GitKV(db, pid) }
    await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })
    log('init complete')
    const author = { name: 'git/init' }
    const commit = await git.commit({
      noUpdateBranch: true,
      fs,
      dir,
      message: 'initial commit',
      author,
    })
    fs.promises.updateTip(commit)
    return new FS(pid, commit, db)
  }
  get fs() {
    return { promises: this.#gitkv }
  }
  #upserts = new Map<string, string | Uint8Array>()
  #deletes = new Set<string>()
  async commit(message: string = '') {
    Debug.enable('AI:git:fs')
    assert(this.#upserts.size > 0 || this.#deletes.size > 0, 'empty commit')
    const tree = await this.#flush()
    this.#upserts.clear()
    this.#deletes.clear()

    const { fs } = this
    const author = { name: 'git/commit' }
    const commit = await git.commit({
      noUpdateBranch: true,
      fs,
      dir,
      message,
      author,
      tree,
    })
    await fs.promises.updateTip(commit)

    return new FS(this.#pid, commit, this.#db)
  }
  async #flush() {
    const oid = await this.#rootOid()
    const { fs } = this
    const { tree: root } = await git.readTree({ fs, dir, oid })
    log('flush tree', root)
    const changes: Tree = {
      oid,
      tree: root,
      upserts: new Map(),
      deletes: new Set(),
      children: new Map(),
    }
    for (let [path, blob] of this.#upserts) {
      log('upsert', path, blob)
      if (typeof blob === 'string') {
        blob = new TextEncoder().encode(blob)
      }
      // TODO parallelize
      const hash = await git.writeBlob({ fs, dir, blob })
      log('hash', hash)
      const parent = ensurePath(changes, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      parent.upserts.set(filename, {
        // https://isomorphic-git.org/docs/en/walk#walkerentry-mode
        mode: '100644',
        path: filename,
        oid: hash,
        type: 'blob',
      })
    }

    for (const path of this.#deletes) {
      log('delete', path)
      const parent = ensurePath(changes, path)
      const filename = path.split('/').pop()
      assert(filename, 'filename not found: ' + path)
      parent.deletes.add(filename)
      // TODO should be able to wipe a whole dir with no effort here
    }

    await retrieveAffectedTrees(changes, fs)

    await bubbleChanges(changes, fs)

    return changes.oid
  }
  delete(path: string) {
    assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
    // TODO delete a whole directory
    assert(!path.endsWith('/'), 'path must not end with /: ' + path)
    log('delete', path)
    this.#deletes.add(path)
    this.#upserts.delete(path)
  }
  write(path: string, data: string | Uint8Array) {
    // buffer it until we are ready to do the commit
    assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
    assert(!path.endsWith('/'), 'path must not end with /: ' + path)
    log('write', path, data)
    this.#upserts.set(path, data)
    this.#deletes.delete(path)
    // TODO store json objects specially, only strinify on commit
  }
  async read(path: string) {
    if (this.#upserts.has(path)) {
      const data = this.#upserts.get(path)
      if (typeof data === 'string') {
        return data
      }
    }
    const blob = await this.readBinary(path)
    return new TextDecoder().decode(blob)
  }
  async readBinary(path: string): Promise<Uint8Array> {
    assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
    assert(!path.endsWith('/'), 'path must not end with /: ' + path)
    log('read', path)
    if (this.#deletes.has(path)) {
      throw new Error('Could not find file or directory: ' + path)
    }
    if (this.#upserts.has(path)) {
      const data = this.#upserts.get(path)
      if (typeof data === 'string') {
        return new TextEncoder().encode(data)
      }
    }

    const oid = await this.#rootOid()
    log('tree', oid)
    const { fs } = this
    const { blob } = await git.readBlob({ dir, fs, oid, filepath: path })
    assert(blob instanceof Uint8Array, 'blob not Uint8Array: ' + typeof blob)
    return blob
  }
  async #rootOid() {
    const { fs } = this
    const result = await git.readCommit({ fs, dir, oid: this.#commit })
    const { tree } = result.commit
    return tree
  }
  // reading a file should use the direct oid walking methods to walk the tree
  // the isolate-api would be just a proxy for the fs object
  async createBranch(name: string) {
    // will make a new branch, write the head to kv
    // errors if the branch already exists
  }
  async switch(branches: string[]) {
    // takes advantage of the cache, checks if the branch is in the kv store
  }
  // the accumulator, the braodcast of live changes, billing, aborting
  // should the watcher of changes be in here too ?
  // it could make child fs items that share the cache
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
const retrieveAffectedTrees = async (tree: Tree, fs: { promises: GitKV }) => {
  const promises = []
  if (!tree.tree) {
    assert(tree.oid, 'tree oid not found')
    const result = await git.readTree({ fs, dir, oid: tree.oid })
    tree.tree = result.tree
  }
  for (const entry of tree.tree) {
    if (entry.type === 'tree') {
      if (tree.children.has(entry.path)) {
        const child = tree.children.get(entry.path)
        assert(child, 'child not found: ' + entry.path)
        child.oid = entry.oid
        promises.push(retrieveAffectedTrees(child, fs))
      }
    }
  }
  await Promise.all(promises)
}
const bubbleChanges = async (tree: Tree, fs: { promises: GitKV }) => {
  const layers = treeToLayers(tree)
  log('layers', layers)
  // cound down thru layers backwards
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
      // add any new blobs
      for (const [, entry] of item.upserts) {
        tree.push(entry)
      }
      // add any new chilren
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
      item.oid = await git.writeTree({ fs, dir, tree })
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
