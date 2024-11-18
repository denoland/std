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

Deno.test('nested trails - manual data structure', () => {
  const childTrailData: TrailStruct = {
    sequence: 1,
    origin: {
      napp: 'child-napp',
      tool: 'child-tool',
      parameters: {},
    },
    requests: {
      0: {
        sequence: 0,
        origin: {
          napp: 'child-napp',
          tool: 'child-action',
          parameters: {},
        },
        requests: {},
        activeMs: 50,
        options: { timeout: DEFAULT_TIMEOUT },
        outcome: { result: 'child result' },
      },
    },
    activeMs: 100,
    options: { timeout: DEFAULT_TIMEOUT },
    outcome: { result: 'child final result' },
  }

  const parentTrailData: TrailStruct = {
    sequence: 2,
    origin: {
      napp: 'parent-napp',
      tool: 'parent-tool',
      parameters: {},
    },
    requests: {
      0: {
        sequence: 1,
        origin: {
          napp: 'parent-napp',
          tool: 'parent-action-1',
          parameters: {},
        },
        requests: childTrailData.requests,
        activeMs: 150,
        options: { timeout: DEFAULT_TIMEOUT },
        outcome: { result: 'parent result 1' },
      },
      1: {
        sequence: 0,
        origin: {
          napp: 'parent-napp',
          tool: 'parent-action-2',
          parameters: {},
        },
        requests: {},
        activeMs: 75,
        options: { timeout: DEFAULT_TIMEOUT },
        outcome: { result: 'parent result 2' },
      },
    },
    activeMs: 300,
    options: { timeout: DEFAULT_TIMEOUT },
  }

  const parentTrail = Trail.recreate(parentTrailData)

  // Test the structure
  const exportedData = parentTrail.export()
  expect(exportedData).toEqual(parentTrailData)

  // Test nested structure
  expect(exportedData.requests[0].requests[0].outcome?.result).toBe(
    'child result',
  )
  expect(exportedData.requests[0].outcome?.result).toBe('parent result 1')
  expect(exportedData.requests[1].outcome?.result).toBe('parent result 2')

  // Test activation and push
  parentTrail.activate().then(async (reason) => {
    expect(reason).toBe(TrailStopReason.Triggered)

    const pushResult = await parentTrail.push({
      napp: 'parent-napp',
      tool: 'parent-action-1',
      parameters: {},
    })
    expect(pushResult).toBe('parent result 1')

    parentTrail.resolve('final result')
  })

  // Test final outcome
  expect(parentTrail.waitForOutcome()).resolves.toBeUndefined()
  expect(parentTrail.export().outcome?.result).toBe('final result')
})

// split out local actions and remote actions

// get all transmission actions

// get all replies that need transmission

// ? should we self reply, so queue up our own actions internally, or use the
// same transmission processing system ?

// test purging of the structure
