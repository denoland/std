// @deno-types="npm:@types/benchmark"
import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { assert } from '@std/assert'
import DB from '@/db.ts'
import { Crypto } from '@/api/web-client-crypto.ts'
import { Backchat } from '@/api/web-client-backchat.ts'

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
Crypto.load(machineEnginePrivateKey) // do premul crypto

const sessionStartSession = await factory()
const sessionReloadSession = await factory()

const coldPingSession = await factory()
const hotPingSession = await factory()
const hotPingActions = await hotPingSession.actions<Api>('io-fixture')
const installSession = await factory()
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
  .add('machine root session', {
    // generate a new machine key and await the root session
    defer: true,
    async fn(deferred: Benchmark.Deferred) {
      const privateKey = Crypto.generatePrivateKey()
      const machine = Machine.load(machineEngine, privateKey)
      await machine.rootTerminalPromise
      deferred.resolve()
    },
  })
  .add('machine reload', {
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const machine = Machine.load(machineEngine, machineEnginePrivateKey)
      await machine.rootTerminalPromise
      deferred.resolve()
    },
  })
  // SESSION
  .add('boot', {
    // start an engine and await the first non root session
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const session = await factory()
      await session.initializationPromise
      deferred.resolve()
    },
  })
  .add('session start', {
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const session = sessionStartSession.newTerminal()
      await session.initializationPromise
      deferred.resolve()
      session.stop()
    },
  })
  .add('session reload', {
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const { pid } = sessionReloadSession
      const session = sessionReloadSession.resumeTerminal(pid)
      await session.initializationPromise
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

  .add('cold ping', {
    // make a new session
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const session = coldPingSession.newTerminal()
      const fixture = await session.actions<Api>('io-fixture')
      const result = await fixture.local()
      assert(result === 'local reply')
      deferred.resolve()
    },
  })
  .add('hot ping', {
    // use an existing session
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const result = await hotPingActions.local()
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
  .add('install', {
    // time how long to install a new multi user app
    defer: true,
    fn: async (deferred: Benchmark.Deferred) => {
      const repo = 'install/' + installCounter++
      await installSession.init({ repo })
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
