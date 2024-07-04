import { Engine } from './engine.ts'
import { Crypto } from './api/web-client-crypto.ts'
import { Backchat } from '@/api/web-client-backchat.ts'
// import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import DB from '@/db.ts'
import { Provisioner } from '@/constants.ts'

const superuserKey = Crypto.generatePrivateKey()
const aesKey = DB.generateAesKey()
const privateKey = Crypto.generatePrivateKey()

const cradleMaker = async (init?: Provisioner) => {
  const engine = await Engine.provision(superuserKey, aesKey, init)
  const backchat = await Backchat.upsert(engine, privateKey)
  return { backchat, engine }
}

Deno.test.only('cradle', async (t) => {
  log.enable('AI:tests AI:engine AI:actors')
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
  })
  await t.step('thread', async () => {
  })
  await engine.stop()

  // test intercepting backchat text
})

// guts('Direct', cradleMaker)

// confirm cannot delete the system chain
