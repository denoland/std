import * as git from '../git/mod.ts'
import { assert, Debug, equal } from '@utils'
import {
  PID,
  PierceReply,
  Poolable,
  Reply,
  SolidReply,
  Solids,
} from '@/constants.ts'
import DB from '@/db.ts'
import FS from '@/git/fs.ts'
import Cradle from '@/cradle.ts'
const log = Debug('AI:io')

export default class IO {
  #db: DB
  #cradle: Cradle
  private constructor(db: DB, self: Cradle) {
    this.#db = db
    this.#cradle = self
  }
  static create(db: DB, self: Cradle) {
    return new IO(db, self)
  }
  async induct(poolable: Poolable) {
    log('induct %o', poolable)
    await this.#db.addToPool(poolable)
    const lockId = await this.#db.getHeadlockMaybe(poolable)
    // TODO remove headlock and use poollock
    if (lockId) {
      const pid = poolable.target
      const solids = await this.#solidifyPool(pid)
      await this.#transmit(pid, solids)
      await this.#db.releaseHeadlock(pid, lockId)
    }
  }
  async inductFiles(reply: SolidReply, fs: FS) {
    log('inductFiles %o %o', reply, fs.commit)
    if (!fs.isChanged) {
      return this.induct(reply)
    }
    const pid = reply.target
    const lockId = await this.#db.getHeadlock(pid)
    const solids = await this.#solidifyPool(pid, reply, fs)
    await this.#transmit(pid, solids)
    await this.#db.releaseHeadlock(pid, lockId)
  }
  async #transmit(pid: PID, solids: Solids) {
    log('solids %o', solids)
    const { commit, request, branches, replies } = solids

    if (request) {
      log('request %o', request)
      // WARNING detaches from queue
      await this.#cradle.request({ request, commit })
    }
    for (const sequence of branches) {
      log('branch %o', sequence)
      await this.#cradle.branch({ pid, sequence, commit })
    }
    for (const reply of replies) {
      if (isPierceReply(reply)) {
        log('pierce reply %o', reply)
        await this.#db.settleReply(pid, reply)
      } else {
        log('solid reply %o', reply)
        await this.induct(reply)
      }
    }
  }
  async #solidifyPool(pid: PID, reply?: SolidReply, fs?: FS) {
    const { poolKeys, pool } = await this.#db.getPooledActions(pid)
    log('solidifyPool %o %i', pid, poolKeys.length)

    if (reply) {
      assert(fs, 'fs must be provided with a reply')
      pool.push(reply)
    }
    if (fs) {
      assert(reply, 'reply must be provided with fs')
      assert(equal(fs.pid, pid), 'fs pid must match')
    } else {
      fs = await FS.openHead(pid, this.#db)
    }
    const solids = await git.solidify(fs, pool)
    await this.#db.deletePool(poolKeys)
    return solids
  }
  async branch(pid: PID, baseCommit: string, sequence: number) {
    // TODO remove the concept of headlock completely
    const lockId = await this.#db.getHeadlock(pid)
    const fs = FS.open(pid, baseCommit, this.#db)
    const branched = await git.branch(fs, sequence)
    const { origin, commit } = branched
    await this.#cradle.request({ request: origin, commit })
    await this.#db.releaseHeadlock(pid, lockId)
  }
}

const isPierceReply = (reply: Reply): reply is PierceReply => {
  return 'ulid' in reply
}
