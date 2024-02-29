import { deserializeError } from 'npm:serialize-error'
import * as git from './git.ts'
import { Debug } from '@utils'
import { PID, Request } from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import FS from '@/artifact/fs.ts'
import Cradle from '@/artifact/cradle.ts'
import { Poolable } from '@/artifact/constants.ts'
const log = Debug('AI:io.')

export default class IO {
  #db!: DB
  #fs!: FS
  #self!: Cradle
  static create(db: DB, self: Cradle) {
    const io = new IO()
    io.#db = db
    io.#fs = FS.create(db)
    io.#self = self
    return io
  }

  async induct(poolable: Poolable) {
    log('induct %o', poolable)
    await this.#db.addToPool(poolable)
    const lockId = await this.#db.getHeadlockMaybe(poolable)
    if (lockId) {
      const pid = poolable.target
      await this.#execute(pid, lockId)
    }
    if (!isRequest(poolable)) {
      return
    }
    const { outcome } = await this.#db.watchReply(poolable)
    if (outcome.error) {
      throw deserializeError(outcome.error)
    }
    return outcome.result
  }
  async #execute(pid: PID, lockId: string) {
    const fs = await this.#fs.load(pid)
    const solids = await this.#solidifyPool(pid, fs)
    log('solids %o', solids)
    const { commit, requests, priors, replies } = solids
    await this.#fs.update(pid, fs, commit, lockId)

    for (const request of requests) {
      // WARNING detaches from queue and relies on watchReply() to complete
      const prior = priors.pop()
      await this.#self.request({ request, prior, commit })
    }
    // TODO branching
    for (const reply of replies) {
      log('reply %o', reply)
      await this.#db.settleReply(pid, reply)
    }
    await this.#db.releaseHeadlock(pid, lockId)
  }
  async #solidifyPool(pid: PID, fs: IFs) {
    log('solidifyPool %o', pid)
    const { poolKeys, pool } = await this.#db.getPooledActions(pid)
    const solids = await git.solidifyPool(fs, pool)
    await this.#db.deletePool(poolKeys)
    return solids
  }
}
function isRequest(poolable: Poolable): poolable is Request {
  return 'isolate' in poolable
}
