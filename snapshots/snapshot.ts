import { monotonicUlid } from '@std/ulid'
import * as posix from '@std/path/posix'
import { assert } from '@std/assert/assert'
import Debug from 'debug'
const log = Debug('@artifact/snapshots')
type Upsert = { oid: string } | { data: string | Uint8Array }

export default class Snapshot {
  static create(snapshotId?: string) {
    return new Snapshot(snapshotId)
  }

  #snapshotId: string | undefined
  #store: SnapshotStore | undefined
  readonly #upserts = new Map<string, Upsert>()
  readonly #deletes = new Set<string>()

  private constructor(snapshotId?: string) {
    this.#snapshotId = snapshotId
  }

  get snapshotId() {
    return this.#snapshotId
  }
  get isChanged() {
    return this.#upserts.size > 0 || this.#deletes.size > 0
  }
  get upserts() {
    return [...this.#upserts.keys()]
  }
  get deletes() {
    return [...this.#deletes]
  }

  async commit() {
    throw new Error('no changes')
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

    if (this.#store) {
      return this.#store.exists(path)
    }
    return false
  }
  delete(path: string) {
    path = refine(path)
    assert(path !== '.', 'cannot delete root')
    // TODO delete a whole directory
    log('delete', path)
    this.#deletes.add(path)
    this.#upserts.delete(path)
  }
}

export interface SnapshotStore {
  exists(path: string): Promise<boolean>
  commit(): Promise<string>
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
