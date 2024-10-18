import { expect, log } from '@utils'
import { CradleMaker, generateBackchatId, print } from '@/constants.ts'
import { Crypto } from '../api/crypto.ts'
import { Backchat } from '../api/client-backchat.ts'
import { Api } from '@/isolates/io-fixture.ts'

export default (cradleMaker: CradleMaker) => {
  const prefix = 'backchats: '
  Deno.test(prefix + 'multi backchat', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { engine } = cradle
    const key = Crypto.generatePrivateKey()
    const backchat = await Backchat.upsert(engine, key)
    log('pid', print(backchat.pid))

    // TODO exercise the ACL blocking some actions to the session chain
    await t.step('initial', async () => {
      const { local } = await backchat.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    const second = await Backchat.upsert(engine, key)
    await t.step('second backchat', async () => {
      const { local } = await second.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    await t.step('cross backchat', async () => {
      const opts = { target: backchat.pid }
      const { local } = await second.actions<Api>('io-fixture', opts)
      const result = await local({})
      expect(result).toEqual('local reply')
    })

    const resumed = await Backchat.upsert(engine, key, backchat.id)
    await t.step('resume session', async () => {
      // TODO this should check if the session is valid
      expect(resumed.pid).toEqual(backchat.pid)
      const { local } = await resumed.actions<Api>('io-fixture')
      const result = await local({})
      expect(result).toEqual('local reply')
    })
    await t.step('invalid session', async () => {
      await expect(Backchat.upsert(engine, key, 'invalid'))
        .rejects.toThrow('Invalid resume backchat id: invalid')

      const almost = generateBackchatId()
      const next = await Backchat.upsert(engine, key, almost)
      expect(next.id).not.toEqual(almost)
    })
  })

  Deno.test(prefix + 'internal requests', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const repo = 'backchats/relay'
    const { pid } = await backchat.init({ repo })

    await t.step('ping', async () => {
      const { branch } = await backchat.actions<Api>('io-fixture', {
        target: pid,
      })
      const result = await branch({})
      expect(result).toEqual('remote pong')
    })
  })
  Deno.test(prefix + 'readTree', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const { pid } = backchat

    await t.step('empty path', async () => {
      const path = ''
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('.', async () => {
      const path = '.'
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('tests', async () => {
      const path = 'tests'
      const result = await backchat.readTree(path, pid)
      expect(result.length).toBeGreaterThan(0)
    })
    await t.step('non existent', async () => {
      const path = 'tests/non-existent'
      await expect(backchat.readTree(path, pid))
        .rejects.toThrow('Could not find')
    })
  })
  Deno.test(prefix + 'splice', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const { pid } = backchat

    await t.step('latest - 1', async () => {
      const [splice] = await backchat.splices(pid)
      const [same] = await backchat.splices(pid, { commit: splice.oid })
      expect(splice).toEqual(same)

      const commit = splice.commit.parent[0]
      const [parent] = await backchat.splices(pid, { commit })
      expect(parent.oid).toEqual(commit)
    })

    await t.step('latest N', async () => {
      const count = 20
      const splices = await backchat.splices(pid, { count })
      expect(splices.length).toEqual(count)
    })
  })
  Deno.test(prefix + 'readBinary', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    await backchat.write('test.txt', 'binary test')

    await t.step('text decoding', async () => {
      const binary = await backchat.readBinary('test.txt')
      expect(binary.length).toBeGreaterThan(0)
      expect(binary).toBeInstanceOf(Uint8Array)

      const text = new TextDecoder().decode(binary)
      expect(text).toEqual('binary test')
    })
    // TODO test error condition of file not found
  })

  Deno.test(prefix + 'readJSON', async (t) => {
    await using cradle = await cradleMaker(t, import.meta.url)
    const { backchat } = cradle
    const { pid } = backchat

    await t.step('latest', async () => {
      const json = await backchat.readJSON('.io.json', pid)
      expect(json).toHaveProperty('sequence')
    })

    await t.step('non existent', async () => {
      await expect(backchat.readJSON('non-existent.json', pid))
        .rejects.toThrow('Could not find')
    })
  })
}
