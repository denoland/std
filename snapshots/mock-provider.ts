import { ripemd160 } from '@noble/hashes/ripemd160'
import { base32 } from 'multiformats/bases/base32'
import { jsonSchema } from '../api/actions.ts'
import { Tip } from './tip.ts'
import {
  type Address,
  FileNotFoundError,
  LineageError,
  type SnapshotsProvider,
} from '../api/napp-api.ts'
import { ulid } from '@std/ulid/ulid'
import type { z } from 'zod'

type LocalReadOptions = Pick<Address, 'snapshot'>
type LocalSnapshotsProvider = SnapshotsProvider<LocalReadOptions>

type Lineage = { tip: Tip; parents: string[] }

export class MockProvider implements LocalSnapshotsProvider {
  static create() {
    return new MockProvider()
  }
  private constructor() {}

  #snapshots = new Map<string, Lineage>()

  #latest: string | undefined

  commit: LocalSnapshotsProvider['commit'] = async (upserts, deletes) => {
    await Promise.resolve()
    if (!upserts.size && !deletes.size) {
      throw new Error('No changes to commit')
    }
    const parents = []
    if (this.#latest) {
      parents.push(this.#latest)
    }
    const id = ulid()
    this.#latest = id
    const tip = Tip.createWith(this, upserts, deletes)
    this.#snapshots.set(id, { tip, parents })
  }
  read: LocalSnapshotsProvider['read'] = {
    meta: async (path, options = {}) => {
      await Promise.resolve()
      if (!this.#latest) {
        throw new FileNotFoundError(path)
      }
      const { snapshot = this.#latest } = options
      if (!snapshot) {
        throw new FileNotFoundError(path)
      }
      const lineage = this.#snapshots.get(snapshot)
      if (!lineage) {
        throw new LineageError(path)
      }
      // TODO handle directories
      const binary = await lineage.tip.read.binary(path)
      const hash = ripemd160(binary)
      return {
        snapshot,
        mode: '100644',
        path,
        oid: base32.encode(hash),
        type: 'blob',
      }
    },
    json: async (path, options) => {
      const text = await this.read.text(path, options)
      const result = JSON.parse(text)
      const schema = options?.schema || jsonSchema
      return schema.parse(result) as z.infer<typeof schema>
    },
    text: async (path, options = {}) => {
      const blob = await this.read.binary(path, options)
      return new TextDecoder().decode(blob)
    },
    binary: async (path, options = {}) => {
      // mock latest needs to not move forwards for the ancestors
      const { snapshot = this.#latest } = options
      if (!snapshot) {
        throw new FileNotFoundError(path)
      }
      const lineage = this.#snapshots.get(snapshot)
      if (!lineage) {
        throw new LineageError(path)
      }
      return lineage.tip.read.binary(path)
    },
    exists: async (path, options = {}) => {
      const { snapshot = this.#latest } = options
      if (!snapshot) {
        return false
      }
      const lineage = this.#snapshots.get(snapshot)
      if (!lineage) {
        // TODO make a lineage fault error
        throw new LineageError(snapshot)
      }
      return lineage.tip.read.exists(path)
    },
    ls: async (path, options = {}) => {
      await Promise.resolve()
      return []
    },
  }
  snapshots: LocalSnapshotsProvider['snapshots'] = {
    latest: () => {
      return Promise.resolve(this.#latest)
    },
    parents: async (options = {}) => {
      const { snapshot = this.#latest } = options
      if (!snapshot) {
        return []
      }
      const lineage = this.#snapshots.get(snapshot)
      if (!lineage) {
        throw new LineageError(snapshot)
      }

      return lineage.parents
    },
    history: async (options = {}) => {
      await Promise.resolve()
      const { count = 1, snapshot = this.#latest } = options
      if (count <= 0) {
        throw new Error('count must be greater than 0')
      }
      if (!snapshot) {
        return []
      }
      const lineage = this.#snapshots.get(snapshot)
      if (!lineage) {
        throw new LineageError(snapshot)
      }
      let current = snapshot
      const history = []
      for (let i = 0; i < count; i++) {
        history.push(current)
        const lineage = this.#snapshots.get(current)
        if (!lineage) {
          break
        }
        const parent = lineage.parents[0]
        if (!parent) {
          break
        }
        current = parent
      }
      return history
    },
  }
}
