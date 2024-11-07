import { Engine } from './engine.ts'
import { Crypto } from './api/crypto.ts'
import DB from '@/db.ts'
import { Backchat } from './api/client-backchat.ts'
import { mockCreator } from '@/isolates/utils/mocker.ts'
import z from 'zod'
import { peekRandomnessCount, randomness } from '@/api/randomness.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()

type SeedSet = {
  count: number
  seed: Deno.KvEntry<unknown>[]
  backchatId: string
}
const seeds = new Map<Provisioner | undefined, SeedSet>()

export type Provisioner = (superBackchat: Backchat) => Promise<void>

export type CradleMaker = (
  t: Deno.TestContext,
  /** The file url that the snapshots are associated with */
  snapshotsFor: string,
  updateSnapshots?: 'updateSnapshots',
  init?: Provisioner,
) => Promise<
  {
    backchat: Backchat
    engine: unknown
    privateKey: string
    [Symbol.asyncDispose](): Promise<void>
  }
>

export const cradleMaker: CradleMaker = async (t, url, update, init) => {
  const mock = mockCreator(z.unknown())
  t.origin = url
  mock.useRecorder(t, update)

  const seedSet = seeds.get(init)
  const seed = seedSet?.seed
  const backchatId = seedSet?.backchatId

  const engine = await Engine.provision(superuserKey, aesKey, init, seed)
  const backchat = await Backchat.upsert(engine, privateKey, backchatId)

  if (!seedSet) {
    seeds.set(init, {
      count: peekRandomnessCount(),
      seed: await engine.dump(),
      backchatId: backchat.id,
    })
  } else {
    while (peekRandomnessCount() < seedSet.count) {
      // must update the randomness seed if the db seed is injected
      randomness()
    }
  }

  const original = engine.stop.bind(engine)
  engine.stop = async () => {
    if (t) {
      mock.teardown()
    }
    await original()
  }

  return {
    backchat,
    engine,
    privateKey,
    [Symbol.asyncDispose]: () => engine.stop(),
  }
}
