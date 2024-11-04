import { expect } from '@std/expect/expect'
import Trail from './trail.ts'
import { assert } from '@std/assert/assert'

Deno.test('trail', async () => {
  const action = {
    napp: 'napp',
    tool: 'tool',
    parameters: {},
  }
  const trail = Trail.create(action)
  expect(() => trail.push(action)).toThrow('not active')

  const symbol = Symbol()
  const triggerPromise = trail.activate(symbol)

  const pushPromise = trail.push(action)

  expect(pushPromise.then).toBeInstanceOf(Function)
  expect(() => trail.export()).toThrow('is active')
  const fake = { sequence: 0, requests: {}, origin: action }
  expect(() => trail.activate(Symbol(), fake)).toThrow('is active')
  expect(await triggerPromise).toBe(symbol)

  trail.deactivate()
  const data = trail.export()

  const resolved = trail.export()
  assert(resolved.requests[0])
  resolved.requests[0].outcome = { result: 'test result' }

  const rejected = trail.export()
  assert(rejected.requests[0])
  rejected.requests[0].outcome = { error: { message: 'test error' } }

  trail.activate(Symbol(), resolved)
  await expect(pushPromise).resolves.toBe('test result')
  trail.deactivate()

  expect(() => trail.activate(Symbol(), rejected)).toThrow('Trail mismatch')
  expect(() => trail.activate(Symbol(), data)).toThrow('Trail mismatch')

  const retrail = Trail.recreate(data)
  expect(retrail.export()).toEqual(data)

  retrail.activate(Symbol())
  const repush = retrail.push(action)
  expect(repush).toBeInstanceOf(Promise)
  retrail.deactivate()

  retrail.activate(Symbol(), rejected)
  await expect(repush).rejects.toThrow('test error')
})
