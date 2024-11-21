import * as posix from '@std/path/posix'
import { assert } from '@std/assert/assert'
import type {
  Address,
  NappRead,
  NappSnapshots,
  NappWrite,
  SnapshotsProvider,
  TreeEntry,
  Upsert,
} from '@artifact/api/napp-api'
import { FileNotFoundError } from '@artifact/api/napp-api'
import Debug from 'debug'
import { jsonSchema } from '@artifact/api/actions'

type NoAddressingOptions = Record<string, never>

const log = Debug('@artifact/snapshots')

type LocalReadOptions = Pick<Address, 'snapshot'>

export interface NappLocal {
  readonly read: NappRead<LocalReadOptions>
  readonly write: NappWrite<NoAddressingOptions>
  readonly snapshots: NappSnapshots<LocalReadOptions>
}

export class Tip implements NappLocal {
  static create(snapshotsProvider: SnapshotsProvider) {
    return new Tip(snapshotsProvider)
  }
  static createWith(
    snaps: SnapshotsProvider,
    upserts: Map<string, Upsert>,
    deletes: Set<string>,
  ) {
    const tip = new Tip(snaps)
    for (const [path, upsert] of upserts) {
      tip.#upserts.set(path, upsert)
    }
    for (const path of deletes) {
      if (upserts.has(path)) {
        throw new Error('cannot delete and upsert at the same time: ' + path)
      }
      tip.#deletes.add(path)
    }
    return tip
  }

  readonly #snapshotsProvider: SnapshotsProvider
  readonly #upserts = new Map<string, Upsert>()
  readonly #deletes = new Set<string>()

  readonly #read: NappLocal['read'] = {
    meta: async (path, options) => {
      path = refine(path)
      return await this.#snapshotsProvider.read.meta(path, options)
    },
    json: async (path, options) => {
      path = refine(path)
      assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)

      const upsert = this.#upserts.get(path)
      if (!options?.snapshot && upsert !== undefined) {
        if ('json' in upsert) {
          return structuredClone(upsert.json)
        }
      }

      const text = await this.read.text(path, options)
      const result = JSON.parse(text)
      const { schema = jsonSchema } = options || {}
      return schema.parse(result)
    },
    text: async (path, options) => {
      path = refine(path)
      const upsert = this.#upserts.get(path)
      if (!options?.snapshot && upsert !== undefined) {
        if ('text' in upsert) {
          return upsert.text
        }
      }

      const blob = await this.read.binary(path, options)
      return new TextDecoder().decode(blob)
    },
    binary: async (path, options) => {
      path = refine(path)
      if (options?.snapshot) {
        return this.#snapshotsProvider.read.binary(path, options)
      }
      if (this.#deletes.has(path)) {
        throw new FileNotFoundError(path)
      }

      const upsert = this.#upserts.get(path)
      if (upsert !== undefined) {
        let text: string | undefined
        if ('json' in upsert) {
          text = JSON.stringify(upsert.json)
        }
        if ('text' in upsert) {
          text = upsert.text
        }
        if (text !== undefined) {
          return new TextEncoder().encode(text)
        }
        if ('data' in upsert) {
          return upsert.data
        }
        if ('meta' in upsert) {
          const { snapshot, path } = upsert.meta
          return this.#snapshotsProvider.read.binary(path, { snapshot })
        }
        throw new Error('invalid upsert: ' + JSON.stringify(upsert))
      }
      return await this.#snapshotsProvider.read.binary(path)
    },
    exists: async (path, options) => {
      path = refine(path)
      if (options?.snapshot) {
        return this.#snapshotsProvider.read.exists(path, options)
      }
      if (this.#deletes.has(path)) {
        return false
      }
      if (this.#upserts.has(path)) {
        return true
      }
      if (this.#snapshotsProvider) {
        return await this.#snapshotsProvider.read.exists(path)
      }
      return false
    },
    ls: async (path = '.', options) => {
      // TODO make a streaming version of this for very large dirs
      path = refine(path)
      log('ls', path)
      if (options?.snapshot) {
        return this.#snapshotsProvider.read.ls(path, options)
      }

      let entries: TreeEntry[] = []
      if (this.#deletes.has(path)) {
        if (path === '.') {
          return entries
        }
        throw new FileNotFoundError(path)
      }
      if (this.#snapshotsProvider) {
        entries = await this.#snapshotsProvider.read.ls(path)
      }

      entries = entries.filter(({ path }) => {
        return !this.#deletes.has(path)
      })

      const dir = posix.dirname(path)
      const has = new Set(entries.map(({ path }) => path))

      for (const path of this.#upserts.keys()) {
        if (posix.dirname(path) === dir) {
          if (!has.has(path)) {
            // TODO handle directories
            entries.push({
              path,
              type: 'blob',
              oid: '',
              mode: '00644',
              snapshot: '',
            })
          }
        }
      }
      return entries
    },
  } as const
  #write: NappLocal['write'] = {
    json: (path, json) => {
      // TODO store json objects specially, only stringify on commit
      path = refine(path)
      assert(posix.extname(path) === '.json', `path must be *.json: ${path}`)

      const string = JSON.stringify(json, null, 2)
      return this.write.text(path, string)
    },
    text: (path: string, content: string) => {
      path = refine(path)
      assert(path !== '.', 'cannot write to root')
      // TODO ensure cannot write to a directory
      log('writeText', path, content)
      this.#upserts.set(path, { text: content })
      this.#deletes.delete(path)
      return Promise.resolve()
    },
    binary: (path: string, content: Uint8Array) => {
      path = refine(path)
      assert(path !== '.', 'cannot write to root')
      // TODO ensure cannot write to a directory
      log('writeBinary', path, content)
      this.#upserts.set(path, { data: content })
      this.#deletes.delete(path)
      return Promise.resolve()
    },
    rm: (path) => {
      path = refine(path)
      assert(path !== '.', 'cannot rm root')
      // TODO delete a whole directory
      log('rm', path)
      if (this.#upserts.has(path)) {
        this.#upserts.delete(path)
      } else {
        this.#deletes.add(path)
      }
      return Promise.resolve()
    },
    mv: async (from, to) => {
      const fromPath = refine(from.path)
      const toPath = refine(to.path)
      if (fromPath === toPath) {
        return
      }
      await this.write.cp(from, to)
      await this.write.rm(from.path)
    },
    cp: async (from, to) => {
      const fromPath = refine(from.path)
      const toPath = refine(to.path)
      if (fromPath === toPath) {
        return
      }

      const upsert = this.#upserts.get(fromPath)
      if (upsert !== undefined) {
        this.#upserts.delete(fromPath)
        this.#upserts.set(toPath, upsert)
        return
      }
      if (this.#deletes.has(fromPath)) {
        throw new FileNotFoundError(fromPath)
      }
      const meta = await this.read.meta(fromPath)
      if (meta.type === 'tree') {
        // TODO cp a directory
        throw new Error('cannot cp a directory')
      }
      this.#deletes.delete(toPath)
      // BUT need to get the snapshot id back from it
      this.#upserts.set(toPath, {
        meta: { snapshot: meta.oid, path: fromPath },
      })
    },
  } as const
  #snapshots: NappLocal['snapshots'] = {
    latest: async (options) => {
      return await this.#snapshotsProvider.snapshots.latest(options)
    },
    parents: async (options) => {
      return await this.#snapshotsProvider.snapshots.parents(options)
    },
    history: async (options) => {
      return await this.#snapshotsProvider.snapshots.history(options)
    },
  } as const

  private constructor(snapshotsProvider: SnapshotsProvider) {
    this.#snapshotsProvider = snapshotsProvider
    Object.freeze(this.#read)
    Object.freeze(this.#write)
    Object.freeze(this.#snapshots)
  }
  get read() {
    return this.#read
  }
  get write() {
    return this.#write
  }
  get snapshots() {
    return this.#snapshots
  }
  get isChanged() {
    return this.#upserts.size > 0 || this.#deletes.size > 0
  }
  async commit() {
    if (!this.isChanged) {
      throw new Error('No changes to commit')
    }
    await this.#snapshotsProvider.commit(this.#upserts, this.#deletes)
    this.#upserts.clear()
    this.#deletes.clear()
  }
}

const refine = (path: string) => {
  path = path.trim()
  while (path.startsWith('/')) {
    path = path.slice(1)
  }
  while (path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  while (path.startsWith('./')) {
    path = path.slice(2)
  }
  if (!path) {
    path = '.'
  }
  path = posix.normalize(path)
  assert(path, `path must be relative: ${path}`)
  assert(!posix.isAbsolute(path), `path must be relative: ${path}`)
  assert(path !== '.git', '.git paths are forbidden: ' + path)
  assert(!path.startsWith('.git/'), '.git paths are forbidden: ' + path)
  assert(!path.endsWith('/'), 'path must not end with /: ' + path)
  assert(!path.startsWith('..'), 'path must not start with ..: ' + path)
  return path
}

export const sortTreeEntries = (tree: TreeEntry[]) => {
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
