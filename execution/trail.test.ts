import { expect } from '@std/expect/expect'
import { Trail, TrailStopReason } from './trail.ts'
import { assert } from '@std/assert/assert'

Deno.test('trail', async () => {
  const action = {
    napp: 'napp',
    tool: 'tool',
    parameters: {},
  }
  const trail = Trail.create(action)
  const fake = trail.export()
  expect(() => trail.push(action)).toThrow('not active')

  const triggerPromise = trail.activate()

  const pushPromise = trail.push(action)

  expect(pushPromise.then).toBeInstanceOf(Function)
  expect(() => trail.export()).toThrow('is active')
  await expect(trail.activate(fake)).rejects.toThrow('is active')
  expect(await triggerPromise).toEqual(TrailStopReason.Triggered)

  const data = trail.export()

  const resolved = trail.export()
  assert(resolved.requests[0])
  resolved.requests[0].outcome = { result: 'test result' }

  const rejected = trail.export()
  assert(rejected.requests[0])
  rejected.requests[0].outcome = { error: { message: 'test error' } }

  trail.activate(resolved)
  await expect(pushPromise).resolves.toBe('test result')

  await expect(trail.activate(rejected)).rejects.toThrow('Trail is active')
  await expect(trail.activate(data)).rejects.toThrow('Trail is active')

  trail.resolve('stop')

  const retrail = Trail.recreate(data)
  expect(retrail.export()).toEqual(data)

  const retrailPromise = retrail.activate()
  const repush = retrail.push(action)
  expect(repush).toBeInstanceOf(Promise)
  await expect(retrailPromise).resolves.toEqual(TrailStopReason.Triggered)

  retrail.activate(rejected)
  retrail.resolve(undefined)
  await expect(repush).rejects.toThrow('test error')
})
