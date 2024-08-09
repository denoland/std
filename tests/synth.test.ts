import { Engine } from '@/engine.ts'
import { Crypto } from '../api/crypto.ts'
import DB from '@/db.ts'
import { Backchat } from '../api/client-backchat.ts'
import { log } from '@utils'
import { type Api } from '@/isolates/longthread.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()
const actorId = 'synthActorId'
const synthPath = 'agents/synth.md'
const assessorPath = 'agents/assessor.md'
const simplePath = 'synth.test.md'

const synth = await Deno.readTextFile('./tests/' + synthPath)
const assessor = await Deno.readTextFile('./tests/' + assessorPath)
const simple = await Deno.readTextFile('./tests/' + simplePath)

Deno.test('synth', async () => {
  const { backchat, engine } = await cradleMaker()
  log.enable('AI:tests AI:longthread AI:synth AI:agents AI:qbr*')
  log('test start')

  await backchat.write(synthPath, synth)
  await backchat.write(assessorPath, assessor)
  await backchat.write(simplePath, simple)

  const actions = await backchat.actions<Api>('longthread')
  const content = `how many tests in ./${simplePath} ?`
  await actions.run({ content, path: synthPath, actorId })

  await engine.stop()
})

export const cradleMaker = async () => {
  const engine = await Engine.provision(superuserKey, aesKey)
  const backchat = await Backchat.upsert(engine, privateKey)
  return { backchat, engine }
}

// first thing to do is generate a full tps report
