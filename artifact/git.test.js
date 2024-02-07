import { assertEquals } from '$std/assert/mod.ts'
import { memfs } from 'https://esm.sh/memfs'
import git from '$git'
import http from '$git/http/web'
import debug from '$debug'
import * as snapshot from 'https://esm.sh/memfs/lib/snapshot'

const debug = Debug('AI:artifact')

Deno.test('git clone', async () => {
  const { fs } = memfs()
  debug('mkdir')
  fs.mkdirSync('/repo')
  fs.mkdirSync('/repo2')
  debug('start')
  const cache = {}
  await git.clone({
    fs,
    http,
    dir: '/repo',
    url: 'https://github.com/dreamcatcher-tech/HAL.git',
    depth: 1,
    noCheckout: true,
    cache,
  })
  debug('cloned')
  const uint8 = snapshot.toBinarySnapshotSync({ fs, dir: '/repo' })
  debug('snapshot', uint8.length)

  const channel = new BroadcastChannel('test')
  channel.postMessage({ type: 'snapshot', uint8 })
  debug('sent snapshot')
  channel.close()
})

const dlock = {
  lockBranch() {
  },
}
