import * as keys from '@/artifact/keys.ts'
import { get, remove, set } from 'https://deno.land/x/kv_toolbox@0.6.1/blob.ts'
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import * as print from 'https://esm.sh/memfs@4.6.0/lib/print'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import DB from './db.ts'
import { assert, Debug } from '@utils'
import { CborUint8Array, PID } from '@/artifact/constants.ts'

const log = Debug('AI:fs')
export default class FS {
  #kv!: Deno.Kv
  static create(db: DB) {
    const fs = new FS()
    fs.#kv = db.kv
    return fs
  }
  async load(pid: PID): Promise<IFs> {
    const uint8 = await this.#loadIsolateFs(pid)
    if (!uint8) {
      const repo = `${pid.account}/${pid.repository}`
      throw new Error('repo not found - pull first: ' + repo)
    }
    const snapshotData = uint8 as CborUint8Array<snapshot.SnapshotNode>
    log('reloaded: repo', pretty(uint8.length))
    // TODO cache locally in case we get reused
    const { fs } = memfs()
    // TODO use unionFs to make layers for each branch
    snapshot.fromBinarySnapshotSync(snapshotData, { fs, path: '/.git' })
    return fs
  }
  async update(pid: PID, fs: IFs, commit: string, lockId: string) {
    assert(commit, 'commit is required')
    const uint8 = snapshot.toBinarySnapshotSync({ fs, path: '/.git' })
    log('updateIsolateFs', pretty(uint8.length))
    await this.#update(pid, uint8, commit, lockId)
    return { size: uint8.length, prettySize: pretty(uint8.length) }
  }
  async #loadIsolateFs(pid: PID) {
    const fsKey = keys.getRepoKey(pid)
    log('loadSnapshot %o', fsKey)
    const blobKey = await this.#kv.get<string[]>(fsKey)
    assert(blobKey.value, 'repo not found: ' + fsKey.join('/'))
    const uint8 = await get(this.#kv, blobKey.value)
    return uint8
  }
  async #update(pid: PID, uint8: Uint8Array, commit: string, lockId: string) {
    // TODO use the versionstamp as the lockId to avoid the key lookup
    const lockKey = keys.getHeadLockKey(pid)
    const currentLock = await this.#kv.get(lockKey)
    if (currentLock.value !== lockId) {
      throw new Error('lock mismatch: ' + lockKey.join('/') + ' ' + lockId)
    }
    const fsKey = keys.getRepoKey(pid)
    // TODO change this to use the commit hash so we can know HEAD
    const blobKey = keys.getBlobKey(pid)
    await set(this.#kv, blobKey, uint8)
    const headKey = keys.getHeadKey(pid)
    const result = await this.#kv.atomic()
      .check(currentLock)
      .set(fsKey, blobKey)
      .set(headKey, commit)
      .commit()
    if (!result.ok) {
      await remove(this.#kv, blobKey)
      throw new Error('lock mismatch: ' + lockKey.join('/') + ' ' + lockId)
    }
    const blobPrefixKey = blobKey.slice(0, -1)
    const oldBlobs = this.#kv.list<string[]>({ prefix: blobPrefixKey })
    for await (const entry of oldBlobs) {
      if (entry.key !== blobKey && entry.key.length === blobKey.length) {
        log('deleting old blob %o', entry.key)
        await remove(this.#kv, entry.key)
      }
    }
  }
  static print(fs: IFs): string {
    return print.toTreeSync(fs)
  }
}
