/**
 * Designed to exercise the pending operations.
 */

import FS from '@/git/fs.ts'
import DB from '@/db.ts'
import IOChannel from '@io/io-channel.ts'

Deno.test('io-channel', async () => {
  // check how the executing request is handled
  // be able to settle pending requests out of order
  // refuse to run unless all of a pending layer is solved
  const db = await DB.create()
  const fs = await FS.init('test/io-channel', db)

  const _io = await IOChannel.load(fs)
  db.stop()
})

// test writing files then doing some accumulation requests, and ensuring that
// those files are present accurately

// if multiple requests are elligible, its always the lowest sequence number

// need to remove the runnablerequest function and just run actions raw somehow
// ?  The transform is bad

// can an unsequenced thing be added without being put into pending ?
