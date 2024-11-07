import Snapshot from '@artifact/snapshots/snapshot'
import { expect } from '@std/expect/expect'

Deno.test('snapshot', async (t) => {
  const s = Snapshot.create()
  await expect(() => s.commit()).rejects.toThrow('no changes')

  const id = await s.commit()
})

// needs to be supplied with an underlying store of sorts.

// this view should be read only, and should be compatible with the fs interface

// so it should take its own self as an interface to the backing store
