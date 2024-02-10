/**
 * Manages the git filesystem.
 */
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import DB from './db.ts'
import debug from '$debug'
import { CborUint8Array, PID } from '@/artifact/constants.ts'

const log = debug('AI:fs')
export default class FS {
  #db!: DB
  static create(db: DB) {
    const fs = new FS()
    fs.#db = db
    return fs
  }
  async isolateFs(pid: PID) {
    const uint8 = await this.#db.loadIsolateFs(pid)
    if (!uint8) {
      const repo = `${pid.account}/${pid.repository}`
      throw new Error('repo not found - pull first: ' + repo)
    }
    const snapshotData = uint8 as CborUint8Array<snapshot.SnapshotNode>
    log('reloaded: repo', pretty(uint8.length))
    // TODO cache locally in case we get reused
    const { fs } = memfs()
    // TODO use unionFs to make layers for each branch
    snapshot.fromBinarySnapshotSync(snapshotData, { fs })
    // log('snapshot loaded', toTreeSync(fs))
    return fs
  }
  async updateIsolateFs(pid: PID, fs: IFs) {
    const uint8 = snapshot.toBinarySnapshotSync({ fs })
    log('updateIsolateFs', pretty(uint8.length))
    await this.#db.updateIsolateFs(pid, uint8)
    return { size: uint8.length, prettySize: pretty(uint8.length) }
  }
}
