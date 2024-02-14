import git from 'https://esm.sh/isomorphic-git@1.25.3'
import { memfs } from 'https://esm.sh/memfs@4.6.0'
import { Debug, expect, log } from '../utils.ts'
import {
  Dispatch,
  ENTRY_BRANCH,
  PID,
  PROCTYPE,
  QMessage,
} from '@/artifact/constants.ts'
import IO from '@io/io.ts'
import DB from '../db.ts'
import FS from '../fs.ts'

Debug.enable('*tests')
Deno.test('serial', async (t) => {
  const queue = async (msg: QMessage) => {
    await Promise.resolve()
    log('queue', msg.name)
    expect(msg.name).toBe('serial')
    const dispatch = msg.params.dispatch as Dispatch
    const sequence = msg.params.sequence as number
    io.processSerial(dispatch, sequence)
  }
  const db = await DB.create(queue)
  const io = IO.create(db)
  const _fs = FS.create(db)
  await t.step('local', async () => {
    const { fs } = memfs()
    await git.init({ fs, dir: '/', defaultBranch: ENTRY_BRANCH })

    const pid: PID = {
      account: 'io',
      repository: 'test',
      branches: [ENTRY_BRANCH],
    }
    const init = await _fs.updateIsolateFs(pid, fs)
    log('init', init)
    const dispatch: Dispatch = {
      pid,
      isolate: 'io-fixture',
      functionName: 'local',
      params: {},
      proctype: PROCTYPE.SERIAL,
      nonce: '1',
    }
    Debug.enable('*')

    const output = await io.dispatch(dispatch)
    log('output:', output)
    const modified = await _fs.isolateFs(pid)
    log('modified', _fs.printFs(modified))
  })

  db.stop()
})
