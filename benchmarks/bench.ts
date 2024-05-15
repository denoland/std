import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Machine } from '@/api/web-client-machine.ts'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { assert } from '@std/assert'
import DB from '@/db.ts'
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
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const session = machine.openSession()
  await session.initializationPromise
  return session
}
const engineFactory = async () => {
  const engine = await Engine.start(superuserKey, aesKey)
  engines.push(engine)
  return engine
}
const machineEngine = await engineFactory()
const remachineEngine = await engineFactory()
const machineEnginePrivateKey = Machine.generatePrivateKey()
Machine.load(remachineEngine, machineEnginePrivateKey) // do premul crypto

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
    fn: async (deferred: Benchmark.deferred) => {
      const engine = await Engine.start(superuserKey, aesKey)
      deferred.resolve()
      await engine.stop()
    },
  })
  // MACHINE
  .add('machine root session', {
    // generate a new machine key and await the root session
    defer: true,
    async fn(deferred: Benchmark.deferred) {
      const privateKey = Machine.generatePrivateKey()
      const machine = Machine.load(machineEngine, privateKey)
      await machine.rootSessionPromise
      deferred.resolve()
    },
  })
  .add('machine reload', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const machine = Machine.load(machineEngine, machineEnginePrivateKey)
      await machine.rootSessionPromise
      deferred.resolve()
    },
  })
  // SESSION
  .add('boot', {
    // start an engine and await the first non root session
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const session = await factory()
      await session.initializationPromise
      deferred.resolve()
    },
  })
  .add('session start', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const session = sessionStartSession.newSession()
      await session.initializationPromise
      deferred.resolve()
      session.stop()
    },
  })
  .add('session reload', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const { pid } = sessionReloadSession
      const session = sessionReloadSession.resumeSession(pid)
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
    fn: async (deferred: Benchmark.deferred) => {
      const session = coldPingSession.newSession()
      const fixture = await session.actions<Api>('io-fixture')
      const result = await fixture.local()
      assert(result === 'local reply')
      deferred.resolve()
    },
  })
  .add('hot ping', {
    // use an existing session
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
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
    fn: async (deferred: Benchmark.deferred) => {
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
    for (const engine of engines) {
      await engine.stop()
    }
  })
  .run()

// then do a cloud version running on a sacrificial deployment
// hundred pings outside
// hundred pings inside
// time to restart an existing session

// ? can a GUTS framework be made to run benchmarks in different environments
