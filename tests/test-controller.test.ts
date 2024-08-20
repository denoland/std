import { Engine } from '@/engine.ts'
import { Crypto } from '../api/crypto.ts'
import DB from '@/db.ts'
import { Backchat } from '../api/client-backchat.ts'
import { log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()
const actorId = 'testerActorId'
const synthPath = 'agents/synth.md'
const assessorPath = 'agents/test-assessor.md'
const simplePath = 'synth.test.md'

const synth = await Deno.readTextFile('./HAL/' + synthPath)
const assessor = await Deno.readTextFile('./HAL/' + assessorPath)
const simple = await Deno.readTextFile('./HAL/tests/' + simplePath)

Deno.test('test file runner', async (t) => {
  const { backchat, engine } = await cradleMaker()

  await backchat.write(synthPath, synth)
  await backchat.write(assessorPath, assessor)
  await backchat.write(simplePath, simple)

  const actions = await backchat.actions<Api>('longthread')
  await t.step('test count', async () => {
    const content = `how many tests in ./${simplePath} ?`
    await actions.run({ content, path: synthPath, actorId })
  })
  log.enable('AI:tests AI:longthread AI:synth AI:agents AI:qbr*')
  await t.step('run tests', async () => {
    const content = `run tests in ./${simplePath}`
    await actions.run({ content, path: synthPath, actorId })
  })

  await engine.stop()
})
Deno.test('test controller', async (t) => {
  const { backchat, engine } = await cradleMaker()

  await backchat.write(synthPath, synth)
  await backchat.write(assessorPath, assessor)
  await backchat.write(simplePath, simple)

  const actions = await backchat.actions<Api>('longthread')
  await t.step('test count', async () => {
    const content = `how many tests in ./${simplePath} ?`
    await actions.run({ content, path: synthPath, actorId })
  })
  log.enable('AI:tests AI:longthread AI:synth AI:agents AI:qbr*')
  await t.step('run tests', async () => {
    const content = `run tests in ./${simplePath}`
    await actions.run({ content, path: synthPath, actorId })
  })

  await engine.stop()
})

export const cradleMaker = async () => {
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)
  return { backchat, engine }
}

// first thing to do is generate a full tps report
