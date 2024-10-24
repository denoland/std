// import { Engine } from '@/engine.ts'
// import { Crypto } from '../api/crypto.ts'
// import DB from '@/db.ts'
// import { Backchat } from '../api/client-backchat.ts'
// import { log } from '@utils'
// import { type Api } from '@/isolates/longthread.ts'
// import { fixture } from '@/tests/fixtures/fixture.ts'

// const actorId = 'test-controller-id'
// const assessorPath = 'agents/test-assessor.md'
// const controllerPath = 'agents/test-controller.md'

// Deno.test.ignore('test file runner', async (t) => {
//   await using cradle = await fixture()

//   const actions = await backchat.actions<Api>('longthread')
//   await t.step('test count', async () => {
//     const content = `how many tests in ./${simplePath} ?`
//     await actions.run({ content, path: synthPath, actorId })
//   })
//   log.enable('AI:tests AI:longthread AI:synth AI:agents AI:qbr*')
//   await t.step('run tests', async () => {
//     const content = `run tests in ./${simplePath}`
//     await actions.run({ content, path: synthPath, actorId })
//   })

// })
// Deno.test.ignore('test controller', async (t) => {
//   await using cradle = await cradleMaker()

//   await backchat.write(synthPath, synth)
//   await backchat.write(assessorPath, assessor)
//   await backchat.write(simplePath, simple)

//   const actions = await backchat.actions<Api>('longthread')
//   await t.step('test count', async () => {
//     const content = `how many tests in ./${simplePath} ?`
//     await actions.run({ content, path: synthPath, actorId })
//   })
//   log.enable('AI:tests AI:longthread AI:synth AI:agents AI:qbr*')
//   await t.step('run tests', async () => {
//     const content = `run tests in ./${simplePath}`
//     await actions.run({ content, path: synthPath, actorId })
//   })

// })

// export const cradleMaker = async () => {
//   const engine = await Engine.provision(superuserKey, aesKey)
//   const backchat = await Backchat.upsert(engine, privateKey)
//   return { backchat, engine }
// }

// // first thing to do is generate a full tps report
