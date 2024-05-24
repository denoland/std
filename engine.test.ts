import { Engine } from './engine.ts'
import { Machine } from './api/web-client-machine.ts'
import guts from './guts/guts.ts'
import { expect, log } from '@utils'
import DB from '@/db.ts'
import { Provisioner } from '@/constants.ts'

const superuserKey = Machine.generatePrivateKey()
const aesKey = DB.generateAesKey()
const cradleMaker = async (init?: Provisioner) => {
  const engine = await Engine.provision(superuserKey, aesKey, init)
  const privateKey = Machine.generatePrivateKey()
  const machine = Machine.load(engine, privateKey)
  const terminal = machine.openTerminal()
  return terminal
}

Deno.test('cradle', async (t) => {
  await t.step('basic', async () => {
    const terminal = await cradleMaker()

    const result = await terminal.ping({ data: 'hello' })
    expect(result).toBe('hello')

    await terminal.rm({ repo: 'dreamcatcher-tech/HAL' })
    const clone = await terminal.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', clone)
    expect(clone.pid).toBeDefined()
    expect(clone.pid.account).toBe('dreamcatcher-tech')
    expect(typeof clone.head).toBe('string')
    await terminal.engineStop()
  })
})

guts('Direct', cradleMaker)

// confirm cannot delete the system chain ?
