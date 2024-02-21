import { deserializeError } from 'npm:serialize-error'
import * as git from './git.ts'
import { Debug } from '@utils'
import { PID, Request } from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import FS from '@/artifact/fs.ts'
import Cradle from '@/artifact/cradle.ts'
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
  async pierce(request: Request) {
    log('pierce %o', request)
    await this.#db.addToPool(request)
    const lockId = await this.#db.getHeadlockMaybe(request)
    if (lockId) {
      await this.#execute(request, lockId)
    }
    const { outcome } = await this.#db.watchReply(request)
    if (outcome.error) {
      throw deserializeError(outcome.error)
    }
    return outcome.result
  }
  async #execute(request: Request, lockId: string) {
    const fs = await this.#fs.load(request.target)
    const solids = await this.#solidifyPool(request.target, fs)
    log('solids %o', solids)
    await this.#fs.update(request.target, fs, lockId)

    for (const request of solids.requests) {
      // create queue messages for artifact queue
      // ? attach the cradle to the api context
      // TODO WARNING thread has now detached
      // this should wait until the queue is written into the db
      await this.#self.request(request)
    }

    // fire off all the executions

    await this.#db.releaseHeadlock(request.target, lockId)
  }
  async #solidifyPool(pid: PID, fs: IFs) {
    log('solidifyPool %o', pid)
    const { poolKeys, pool } = await this.#db.getPooledActions(pid)
    const solids = await git.solidifyPool(fs, pool)
    await this.#db.deletePool(poolKeys)
    return solids
  }
}
