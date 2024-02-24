import { expect, log } from '@utils'
import DB from '@/artifact/db.ts'
import { PierceRequest, PROCTYPE } from '@/artifact/constants.ts'

Deno.test('db', async (t) => {
  const db = await DB.create()
  expect(db.isTestMode).toBe(true)
  const pid = { account: 'a', repository: 'r', branches: ['b'] }
  await t.step('getHeadlock', async () => {
    const lockId = await db.getHeadlock(pid)
    log('lockId %o', lockId)
    const lockPromise = db.getHeadlock(pid)
    await db.releaseHeadlock(pid, lockId)
    const secondLockId = await lockPromise
    log('secondLockId %o', secondLockId)
    expect(secondLockId).not.toBe(lockId)
    expect(secondLockId).toBeDefined()
    await db.releaseHeadlock(pid, secondLockId)
  })
  const request: PierceRequest = {
    target: pid,
    ulid: 'getHeadlockMaybe',
    isolate: 'test',
    functionName: 'test',
    params: {},
    proctype: PROCTYPE.SERIAL,
  }
  await t.step('getHeadlockMaybe', async () => {
    const lockId = await db.getHeadlock(pid)
    log('lockId %o', lockId)
    expect(lockId).toBeDefined()
    const poolKey = await db.addToPool(request)
    log('poolKey %o', poolKey)
    const lockPromise = db.getHeadlockMaybe(request)
    await db.deletePool([poolKey])
    const secondLockId = await lockPromise
    expect(secondLockId).toBeUndefined()
    await db.releaseHeadlock(pid, lockId)
  })
  await t.step('a thousand locks', async () => {
    const lockId = await db.getHeadlock(pid)
    expect(lockId).toBeDefined()
    const locks: Promise<unknown>[] = []
    const keys: string[][] = []
    const promises = []
    log('promises start')
    for (let i = 0; i < 20; i++) {
      const irequest = { ...request, ulid: 'test-' + i }
      promises.push(
        db.addToPool(irequest)
          .then((key) => {
            keys.push(key as string[])
            locks.push(db.getHeadlockMaybe(irequest))
          }),
      )
    }
    await Promise.all(promises)
    log('promises done for %o', keys.length)
    await db.deletePool(keys)
    log('deleted pool')
    const lockIds = await Promise.all(locks)
    lockIds.forEach((lockId) => {
      expect(lockId).toBeUndefined()
    })
  })

  db.stop()
})
