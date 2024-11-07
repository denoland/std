import Compartment from './compartment.ts'
import { expect } from '@std/expect'
import actionCreators from '@artifact/api/actions'
import { Trail } from './trail.ts'

Deno.test('compartment loads a napp', async (t) => {
  const actions = await actionCreators('@artifact/files')
  const action = actions.write({ path: 'test.txt', content: 'hello world' })

  const compartment = await Compartment.load('@artifact/files')

  const next = await compartment.execute(action)
  expect(next).toBeInstanceOf(Trail)

  // next should be a trail

  // execute an action
  // receive back some filesystem reading

  // fullfill the filesystem action

  // filesystem ingoing actions should get fulfilled too, since they require
  // reading.
  // rule is that anything with a reply should be in the local object store, and
  // any request that is within the local object store should be fulfilled
  // during runtime.

  // api needs a filesystem abstraction so we can test it.

  // test is that we can execute an action against it

  // pass in the action we want to execute ?
  // pass in the accumulator, which has results of the execution previously ?

  // compartment used to take the api in,

  const functions = compartment.functions()
  expect(functions).toHaveProperty('write')

  functions.write({ path: 'test.txt', content: 'hello world' })

  // test calling a function with some files attached to it
})

Deno.test('napp api', async (t) => {
  // test generating a typed based function call, using a separate library from
  // compartment, since compartment is an executor, but actions could be
  // generated anywhere.

  // compartment first loads an image, and then it gets instanced each function
  // call
})

// purpose is to load a napp and then

// the compartment has properties that are the api of the napp
// it takes as params the json part of the function call
// schema checking is done by the compartment, using ajv
// returns checking is done by the compartment too
// errors are returned and remapped, or turned into the standard test format
// may adorn the errors with napp based information, so it can help the LLM file
// a bug

// call flow is:
// 1. send in a function

// inner actions, outer actions ?

// is the fs all that is needed to recover prior accumulations ?
// so load it up from the supplied fs ?

// the fs abstraction helps as it could be anything ?
