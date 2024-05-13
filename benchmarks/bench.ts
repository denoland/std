import Benchmark from 'benchmark'
import { Debug } from '@utils'
import { Machine } from '@/api/web-client-machine.ts'
import { Engine } from '@/engine.ts'
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

const factory = async () => {
  const engine = await Engine.start(superuserKey)
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const session = machine.openSession()
  return session
}

suite
  .add('boot', {
    defer: true,
    fn: async (deferred: Benchmark.deferred) => {
      await factory()
      deferred.resolve()
    },
  })
  //   .add('cold ping', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await coldPing()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('hot ping', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await hotPing()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('publish', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await publish()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('install', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       const engine = await publish()
  //       await install(engine)
  //       deferred.resolve()
  //     },
  //   })
  //   .add('add customer', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await addCustomer()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('block making', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await makePulse()
  //       deferred.resolve()
  //     },
  //   })
  //   .add('unsigned block making', {
  //     defer: true,
  //     fn: async (deferred) => {
  //       await makeUnsigned()
  //       deferred.resolve()
  //     },
  //   })
  .on('cycle', (event: Benchmark.Event) => {
    console.log(String(event.target))
  })
  .run({ async: true })
