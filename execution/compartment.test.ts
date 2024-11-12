import Compartment from './compartment.ts'
import { expect } from '@std/expect'
import actionCreators from '@artifact/api/actions'
import { Trail } from './trail.ts'
import type { Tip } from '@artifact/snapshots/tip'
import { assert } from '@std/assert/assert'
import Debug from 'debug'

const resolveLocalFiles = async (trail: Trail, tip: Tip) => {
  assert(!tip.isChanged, 'Cannot resolve local files on a changed tip')

  // walk the trail
  // anything that is an unresolved action for the trail, resolve it with an
  // action and the inflated contents
  // every other action that is a local file request, if this trail doesn't have
  // any inflation for it, retrieve the results

  // do this all in parallel
}

Deno.test('compartment loads a napp', async (t) => {
  Debug.enable('@artifact/execution, @artifact/files')
  const actions = await actionCreators('@artifact/files')
  const action = actions.write({ path: 'test.txt', content: 'hello world' })
  const trail = Trail.create(action)

  await Compartment.load('@artifact/files', trail)

  // loop around activating the trail, then resolving local files and inflating
  // if no inflation, then returns just a promise as tho the action never
  // resolved

  await trail.activate()

  console.dir(trail.export())

  trail.abort()
})

// test throwing something that is not an error object

// test returning but having some triggered actions outstanding

Deno.test('napp api', async (t) => {
  // test generating a typed based function call, using a separate library from
  // compartment, since compartment is an executor, but actions could be
  // generated anywhere.
})
// schema checking needs to be done by the trail ?
// returns checking needs to be done as well
