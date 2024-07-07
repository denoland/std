import { Engine } from './engine.ts'
import { Crypto } from './api/web-client-crypto.ts'
import { Backchat } from '@/api/web-client-backchat.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import DB from '@/db.ts'
import { Provisioner } from '@/constants.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()

type SeedSet = { seed: Deno.KvEntry<unknown>[]; backchatId: string }
const seeds = new Map<Provisioner | undefined, SeedSet>()

const cradleMaker = async (init?: Provisioner) => {
  const seedSet = seeds.get(init)
  const seed = seedSet?.seed
  const backchatId = seedSet?.backchatId
  const engine = await Engine.provision(superuserKey, aesKey, init, seed)
  const backchat = await Backchat.upsert(engine, privateKey, backchatId)
  if (!seedSet) {
    seeds.set(init, { seed: await engine.dump(), backchatId: backchat.id })
  }
  return { backchat, engine }
}

Deno.test('cradle', async (t) => {
  const { backchat, engine } = await cradleMaker()
  await t.step('basic', async () => {
    const result = await backchat.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await backchat.rm({ repo: 'dreamcatcher-tech/HAL' })
    const clone = await backchat.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
  })
  await t.step('second backchat', async () => {
    const next = await Backchat.upsert(engine, privateKey)
    expect(next.pid).not.toEqual(backchat.pid)
    expect(next.id).not.toEqual(backchat.id)
  })
  await t.step('new thread', async () => {
    // start a new thread using backchat
  })
  await engine.stop()

  // test intercepting backchat text
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain
