import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Machine } from '@/api/web-client-machine.ts'
import { Engine } from '@/engine.ts'
import { Api } from '@/isolates/io-fixture.ts'
import { assert } from '@std/assert'
import DB from '@/db.ts'
const log = Debug('AI:benchmarks')
Debug.enable('AI:benchmarks')
log('starting benchmarks')

const suite = new Benchmark.Suite()

// const coldPing = async () => {
//   const engine = await Interpulse.createCI()
//   const payload = { test: 'ping' }
//   const reply = await engine.ping('.', payload)
//   assert(equals(reply, payload))
// }
// const engine = await Interpulse.createCI()

// const hotPing = async () => {
//   const payload = { test: 'ping' }
//   const reply = await engine.ping('.', payload)
//   assert(equals(reply, payload))
// }

// const publish = async () => {
//   const { crm } = apps
//   const engine = await Interpulse.createCI({
//     overloads: { '/dpkgCrm': crm.covenant },
//   })
//   const { path } = await engine.publish('dpkgCrm', crm.covenant)
//   assert.strictEqual(path, '/dpkgCrm')
//   return engine
// }
// const install = async (engine) => {
//   const covenant = '/dpkgCrm'
//   await engine.add('crm', { covenant })
// }

// const crmSetup = async () => {
//   const engine = await publish()
//   await install(engine)
//   const crmActions = await engine.actions('/crm/customers')
//   return crmActions
// }
// const crmActions = await crmSetup()
// let custNo = 100
// const addCustomer = async () => {
//   await crmActions.add({ formData: { custNo, name: `test name ${custNo}` } })
//   custNo++
// }

const superuserKey = Machine.generatePrivateKey()
const aesKey = DB.generateAesKey()

const factory = async () => {
  const engine = await Engine.start(superuserKey, aesKey)
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const session = machine.openSession()
  return session
}

const coldPingSession = await factory()
const hotPingSession = await factory()
const hotPingActions = await hotPingSession.actions<Api>('io-fixture')

suite
  .add('boot', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      const session = await factory()
      deferred.resolve()
      await session.engineStop()
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
  //   .add('install', {
  // clone an existing repo
  //     defer: true,
  //     fn: async (deferred) => {
  //       const engine = await publish()
  //       await install(engine)
  //       deferred.resolve()
  //     },
  //   })
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
    await coldPingSession.engineStop()
    await hotPingSession.engineStop()
  })
  .run({ async: false })

// then do a cloud version running on a sacrificial deployment
// hundred pings outside
// hundred pings inside
// time to restart an existing session

// ? can a GUTS framework be made to run benchmarks in different environments
