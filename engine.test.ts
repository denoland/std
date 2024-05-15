import { Engine } from './engine.ts'
import { Machine } from './api/web-client-machine.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import DB from '@/db.ts'
import { Provisioner } from '@/constants.ts'

const superuserKey = Machine.generatePrivateKey()
const aesKey = DB.generateAesKey()
const cradleMaker = async (init?: Provisioner) => {
  const engine = await Engine.start(superuserKey, aesKey, init)
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const session = machine.openSession()
  return session
}

Deno.test('cradle', async (t) => {
  await t.step('basic', async () => {
    const session = await cradleMaker()

    const result = await session.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await session.rm({ repo: 'dreamcatcher-tech/HAL' })
    const clone = await session.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
    await session.engineStop()
  })
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain ?
