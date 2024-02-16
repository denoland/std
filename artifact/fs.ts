/**
 * Manages the git filesystem.
 */
import { IFs, memfs } from 'https://esm.sh/memfs@4.6.0'
import * as snapshot from 'https://esm.sh/memfs@4.6.0/lib/snapshot'
import * as print from 'https://esm.sh/memfs@4.6.0/lib/print'
import pretty from 'https://esm.sh/pretty-bytes@6.1.1'
import DB from './db.ts'
import { Debug } from '@utils'
import { CborUint8Array, PID } from '@/artifact/constants.ts'

const log = Debug('AI:fs')
export default class FS {
  #db!: DB
  static create(db: DB) {
    const fs = new FS()
    fs.#db = db
    return fs
  }
  async isolateFs(pid: PID) {
    // TODO require valid headlock to be passed in
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
    snapshot.fromBinarySnapshotSync(snapshotData, { fs, path: '/.git' })
    // log('snapshot loaded', toTreeSync(fs))
    return fs
  }
  async updateIsolateFs(pid: PID, fs: IFs) {
    const uint8 = snapshot.toBinarySnapshotSync({ fs, path: '/.git' })
    log('updateIsolateFs', pretty(uint8.length))
    await this.#db.updateIsolateFs(pid, uint8)
    return { size: uint8.length, prettySize: pretty(uint8.length) }
  }
  static printFs(fs: IFs) {
    return print.toTreeSync(fs)
  }
}
