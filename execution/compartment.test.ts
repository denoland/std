import Compartment from './compartment.ts'
import { expect } from '@std/expect'
import actionCreators from '@artifact/api/actions'
import { Trail, TrailStopReason } from './trail.ts'
import { Tip } from '@artifact/snapshots/tip'
import { MockProvider } from '@artifact/snapshots/mock-provider'
import Debug from 'debug'
import { resolveLocalFiles } from './filesResolver.ts'

Deno.test('compartment loads a napp', async (t) => {
  Debug.enable('@artifact/execution, @artifact/files')
  const actions = await actionCreators('@artifact/files')
  const action = actions.write({ path: 'test.txt', content: 'hello world' })
  const trail = Trail.create(action)

  await Compartment.load('@artifact/files', trail)

  let stopReason: TrailStopReason
  const provider = MockProvider.create()
  const tip = Tip.create(provider)

  let withResolves = trail.export()
  do {
    stopReason = await trail.activate(withResolves)
    if (stopReason === TrailStopReason.Triggered) {
      console.log('triggered')
      console.dir(trail.export())

      withResolves = await resolveLocalFiles(trail, tip)
    }
  } while (stopReason !== TrailStopReason.Settled)

  expect(tip.isChanged).toBe(true)
  expect(await tip.read.text('test.txt')).toBe('hello world')

  console.dir(trail.export())
})

// test throwing something that is not an error object

// test returning but having some triggered actions outstanding

Deno.test('napp api', async (t) => {
  // test generating a typed based function call, using a separate library from
  // compartment, since compartment is an executor, but actions could be
  // generated anywhere.
})
// schema checking needs to be done by the compartment or the trail ?
// returns checking needs to be done as well
