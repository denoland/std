import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Machine } from '@/api/web-client-machine.ts'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { assert } from '@std/assert'
import DB from '@/db.ts'
const log = Debug('AI:benchmarks')
Debug.enable('AI:benchmarks ')
log('starting benchmarks')

const suite = new Benchmark.Suite()

const superuserKey = Machine.generatePrivateKey()
const aesKey = DB.generateAesKey()

const engines: Engine[] = []
const factory = async () => {
  const engine = await engineFactory()
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const session = machine.openSession()
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

const coldPingSession = await factory()
const hotPingSession = await factory()
const hotPingActions = await hotPingSession.actions<Api>('io-fixture')
const installSession = await factory()
let installCounter = 0

log('setup complete')

suite
  .add('engine cold start', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const engine = await Engine.start(superuserKey, aesKey)
      deferred.resolve()
      await engine.stop()
    },
  })
  .add('machine root session', {
    // generate a new machine key and await the root session
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
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
  // given a booted engine, how long till a new machine session
  // given a booted machine, how long until the first browser session ?
  // given a provisioned engine, how long to set up a new engine ?

  // multihop ping
  // write one file then return
  // write a deeply nested file then return

  // read a shallow file
  // read a deeply nested file externaly
  // time delay to a splice

  // make a single new daemon branch
  // make several new daemon branches

  // ? how can we map how long a branch takes to make ?

  .add('boot', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      await factory()
      deferred.resolve()
    },
  })
  .add('cold ping', {
    // make a new session
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const session = coldPingSession.newSession()
      const fixture = await session.actions<Api>('io-fixture')
      const result = await fixture.local()
      deferred.resolve()
      assert(result === 'local reply')
    },
  })
  .add('hot ping', {
    // use an existing session
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const result = await hotPingActions.local()
      deferred.resolve()
      assert(result === 'local reply')
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
  .run({ async: false })

// then do a cloud version running on a sacrificial deployment
// hundred pings outside
// hundred pings inside
// time to restart an existing session

// ? can a GUTS framework be made to run benchmarks in different environments
