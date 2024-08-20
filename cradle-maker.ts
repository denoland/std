import { Engine } from './engine.ts'
import { Crypto } from './api/crypto.ts'
import DB from '@/db.ts'
import { Provisioner } from '@/constants.ts'
import { Backchat } from './api/client-backchat.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()

type SeedSet = { seed: Deno.KvEntry<unknown>[]; backchatId: string }
const seeds = new Map<Provisioner | undefined, SeedSet>()

export const cradleMaker = async (init?: Provisioner) => {
  const seedSet = seeds.get(init)
  const seed = seedSet?.seed
  const backchatId = seedSet?.backchatId

  const engine = await Engine.provision(superuserKey, aesKey, init, seed)
  const backchat = await Backchat.upsert(engine, privateKey, backchatId)
  if (!seedSet) {
    seeds.set(init, {
      seed: await engine.dump(),
      backchatId: backchat.threadId,
    })
  }
  return { backchat, engine, privateKey }
}
