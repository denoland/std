import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { assert } from '@std/assert/assert'
import DB from '@/db.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'

const log = Debug('AI:benchmarks')
Debug.enable('AI:benchmarks AI:qbr')
log('starting benchmarks')

const suite = new Benchmark.Suite()

const superuserKey =
  'ed7a15e43c8ca247b61b61af438392b31b71fe2e9eb500b58e0773fc5eb99b8b'
const aesKey = DB.generateAesKey()

const engines: Engine[] = []
const factory = async () => {
  const engine = await engineFactory()
  const privateKey = Crypto.generatePrivateKey()
  const backchat = await Backchat.upsert(engine, privateKey)
  return backchat
}
const engineFactory = async () => {
  const engine = await Engine.provision(superuserKey, aesKey)
  engines.push(engine)
  return engine
}
const machineEngine = await engineFactory()
const machineEnginePrivateKey = Crypto.generatePrivateKey()
Crypto.load(machineEnginePrivateKey) // do premul crypto so run is not skewed

const backchatStartThread = await factory()
const backchatReload = await factory()

const hotPing = await factory()
const hotPingActions = await hotPing.actions<Api>('io-fixture')
const install = await factory()
let installCounter = 0

log('setup complete')

suite
  // ENGINE
  .add('engine cold start', {
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const engine = await Engine.provision(superuserKey, aesKey)
      deferred.resolve()
      await engine.stop()
    },
  })
  // MACHINE
  .add('machine root session', { // RENAME to: backchat create
    // generate a new machine key and await backchat to upsert
    defer: true,
    async fn(deferred: Benchmark.Deferred) {
      const privateKey = Crypto.generatePrivateKey()
      await Backchat.upsert(machineEngine, privateKey)
      deferred.resolve()
    },
  })
  .add('machine reload', { // RENAME to: backchat reload
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      await Backchat.upsert(machineEngine, machineEnginePrivateKey)
      deferred.resolve()
    },
  })
  // SESSION
  .add('boot', { // RENAME to: full boot from cold
    // start an engine and await backchat to upsert
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      await factory()
      deferred.resolve()
    },
  })
  .add('session start', { // RENAME to: new thread
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      await backchatStartThread.newThread()
      deferred.resolve()
    },
  })
  .add('session reload', { // RENAME to: backchat reload
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      await Backchat.upsert(
        machineEngine,
        machineEnginePrivateKey,
        backchatReload.id,
      )
      deferred.resolve()
    },
  })
  // given an engine that is provisioned, how long to recover the super user ?

  // multihop ping
  // write one file then return
  // write a deeply nested file then return

  // read a shallow file
  // read a deeply nested file externally
  // time delay to a splice

  // make a single new daemon branch
  // make several new daemon branches

  // run a benchmark from inside an isolate, skipping pierce
  // ? how can we map how long a branch takes to make ?

  .add('cold ping', { // RENAME to: create backchat then ping
    // make a new session
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const backchat = await Backchat.upsert(
        machineEngine,
        machineEnginePrivateKey,
      )
      const fixture = await backchat.actions<Api>('io-fixture')
      const result = await fixture.local({})
      assert(result === 'local reply')
      deferred.resolve()
    },
  })
  .add('hot ping', { // RENAME to: ping local
    // use an existing session
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const result = await hotPingActions.local({})
      assert(result === 'local reply')
      deferred.resolve()
    },
  })
  // try get max thruput by not waiting for things to complete ?
  //   .add('publish', {
  // make a new repo ?
  //     defer: true,
  //     fn: async (deferred) => {
  //       await publish()
  //       deferred.resolve()
  //     },
  //   })
  .add('install', { // RENAME to: init repo
    // time how long to install a new multi user app
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const repo = 'install/' + installCounter++
      await install.init({ repo })
      deferred.resolve()
    },
  })
  //   .add('add customer', {
  // ignoring the NL operations, this is adding raw data
  //     defer: true,
  //     fn: async (deferred) => {
  //       await addCustomer()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('block making', {
  // make a new commit ?
  //     defer: true,
  //     fn: async (deferred) => {
  //       await makePulse()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('unsigned block making', {
  // make a new commit without signing it
  //     defer: true,
  //     fn: async (deferred) => {
  //       await makeUnsigned()
  //       deferred.resolve()
  //     },
  //   })
  .on('cycle', (event: Benchmark.Event) => {
    // console output is how the results to the benchmark are captured
    // deno-lint-ignore no-console
    console.log(String(event.target))
  })
  .on('complete', async function () {
    log('cleaning up')
    let count = 0
    for (const engine of engines) {
      log('stopping engine', ++count)
      await engine.stop()
    }
  })
  .run({ async: false })

// then do a cloud version running on a sacrificial deployment
// hundred pings outside
// hundred pings inside
// time to restart an existing session

// ? can a GUTS framework be made to run benchmarks in different environments

// bulk copy files speed test, as well as single binary file test
// bulk file read without cache.

// multiple stage ping test
// branch and some multiple requests test
// also test the branch task going sequentially
