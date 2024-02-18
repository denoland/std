import { deserializeError, serializeError } from 'npm:serialize-error'
import Compartment from './compartment.ts'
import { assert } from 'std/assert/mod.ts'
import git from '$git'
import { Debug } from '@utils'
import IsolateApi from '@/artifact/isolate-api.ts'
import {
  IO_PATH,
  IoStruct,
  Outcome,
  PID,
  PROCTYPE,
  Request,
} from '@/artifact/constants.ts'
import DB from '@/artifact/db.ts'
import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import { Poolable } from '@/artifact/constants.ts'
import FS from '@/artifact/fs.ts'
const log = Debug('AI:io')

export default class IO {
  #db!: DB
  #fs!: FS
  static create(db: DB) {
    const io = new IO()
    io.#db = db
    io.#fs = FS.create(db)
    return io
  }
  async dispatch(dispatch: Request) {
    log('dispatch with isolate: %O', dispatch)
  }
}
