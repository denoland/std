import Cradle from './cradle.ts'
import { expect, log } from '@utils'

Deno.test('io', async (t) => {
  const artifact = await Cradle.create()
  await t.step('ping empty', async () => {
    const empty = await artifact.ping()
    expect(empty).toEqual({})
  })
  await t.step('ping with params', async () => {
    const result = await artifact.ping({ test: 'test' })
    expect(result).toEqual({ test: 'test' })
  })

  await t.step('clone', async () => {
    const cloneResult = await artifact.clone({ repo: 'dreamcatcher-tech/HAL' })
    log('clone result', cloneResult)
    const target = cloneResult.pid
    // TODO read the fs and see what the state of the file system is ?
    expect(target).toBeDefined()
  })

  await artifact.stop()
})
Deno.test.ignore('child to self', async () => {})
Deno.test.ignore('child to child', async () => {})
Deno.test.ignore('child to parent', async () => {})
Deno.test('pierce', async (t) => {
  const isolate = 'io-fixture'
  const artifact = await Cradle.create()
  const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })
  const pierces = await artifact.pierces(isolate, target)
  await t.step('local', async () => {
    const result = await pierces.local()
    log('local result', result)
    expect(result).toBe('local reply')
  })
  await t.step('second local', async () => {
    const second = await pierces.local()
    expect(second).toBe('local reply')
  })

  await t.step('throws', async () => {
    const message = 'test message'
    await expect(pierces.error({ message })).rejects.toThrow(message)
  })
  await t.step('params fails validation', async () => {
    const msg = 'Parameters Validation Error: '
    await expect(pierces.local({ invalid: 'parameters' })).rejects.toThrow(msg)
  })
  // await t.step('child process', async () => {
  //   const result = await pierces.spawn({ isolate })
  //   expect(result).toBe('remote pong')
  // })
  await artifact.stop()
})

const isolate = 'io-fixture'
Deno.test('resource hogging', async (t) => {
  await t.step('multi local', async () => {
    const artifact = await Cradle.create()
    const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })
    const { local } = await artifact.pierces(isolate, target)
    const promises = []
    for (let i = 0; i < 20; i++) {
      promises.push(local())
    }
    log('promises start')
    const results = await Promise.all(promises)
    for (const result of results) {
      expect(result).toBe('local reply')
    }
    log('done')

    const logs: unknown[] = await artifact.logs({ repo: 'cradle/pierce' })
    log('logs', logs.length)
    await artifact.stop()
  })
  // TODO get some branch tests going
  // await t.step('branch', async () => {
  //   const artifact = await Cradle.create()
  //   const { pid: target } = await artifact.init({ repo: 'cradle/pierce' })

  //   // pierce the base branch with a spawn instruction
  //   // then do a long running spawn that remains open

  //   const { branch } = await artifact.pierces(isolate, target)
  //   const result = await branch()
  //   log('branch result', result)
  //   await artifact.stop()
  // })
})
