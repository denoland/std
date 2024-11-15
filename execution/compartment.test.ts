import Compartment from './compartment.ts'
import { expect } from '@std/expect'
import actionCreators from '@artifact/api/actions'
import { Trail, TrailStopReason, type TrailStruct } from './trail.ts'
import { type NappLocal, Tip } from '@artifact/snapshots/tip'
import { assert } from '@std/assert/assert'
import { MockProvider } from '@artifact/snapshots/mock-provider'
import Debug from 'debug'
import { type AddressedOptions, optionsSchema } from '../api/napp-api.ts'

Deno.test('compartment loads a napp', async (t) => {
  Debug.enable('@artifact/execution, @artifact/files')
  const actions = await actionCreators('@artifact/files')
  const action = actions.write({ path: 'test.txt', content: 'hello world' })
  const trail = Trail.create(action)

  await Compartment.load('@artifact/files', trail)

  let reason: TrailStopReason
  const provider = MockProvider.create()
  const tip = Tip.create(provider)

  let withResolves = trail.export()
  do {
    reason = await trail.activate(withResolves)
    if (reason === TrailStopReason.Triggered) {
      console.log('triggered')
      console.dir(trail.export())

      withResolves = trail.export()
      for (const [index, request] of entries(withResolves)) {
        if (isApiRequest(request)) {
          console.log('local file request')

          const [category, command] = request.origin.tool.split('/')
          switch (category as keyof NappLocal) {
            case 'read': {
              const { path = '.', options: o = {} } = request.origin.parameters
              assert(typeof path === 'string', 'path must be a string')
              const options = optionsSchema.parse(o) as AddressedOptions
              switch (command as keyof NappLocal['read']) {
                case 'meta': {
                  const result = await tip.read.meta(path, options)
                  console.log('result', result)
                  break
                }
                case 'json': {
                  const result = await tip.read.json(path, options)
                  console.log('result', result)
                  break
                }
                default:
                  throw new Error('Command not found: ' + command)
              }
              break
            }
            case 'write': {
              const { path } = request.origin.parameters
              switch (command as keyof NappLocal['write']) {
                case 'json': {
                  assert(typeof path === 'string', 'path must be a string')
                  const upsert = trail.extractPayload(index)
                  if ('json' in upsert) {
                    console.log('upsert', upsert)
                    await tip.write.json(path, upsert.json)
                    break
                  }
                  throw new Error('json not in upsert')
                }
                case 'text': {
                  assert(typeof path === 'string', 'path must be a string')
                  const upsert = trail.extractPayload(index)
                  if ('text' in upsert) {
                    console.log('upsert', upsert)
                    await tip.write.text(path, upsert.text)
                    break
                  }
                  throw new Error('text not in upsert')
                }
              }
              break
            }
            default:
              throw new Error('Category not found: ' + category)
          }
        }

        // now the tip is reconciled with the payload buffer, so resolve the
        // action

        const snapshot = await tip.snapshots.latest()
        request.outcome = { result: { snapshot: snapshot || null } }
      }

      // resolve needs to include snapshot information so it is recoverable next
      // time
      // so two pass - one for all the unresolved actions, then second to
      // inflate all the resolved snapshots

      // if the action is destined to the local files, then execute these ones

      // resolve self addresses

      // take the actions in and map them to the tip functions
    }
  } while (reason !== TrailStopReason.Settled)

  expect(tip.isChanged).toBe(true)
  expect(await tip.read.text('test.txt')).toBe('hello world')

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
// schema checking needs to be done by the compartment or the trail ?
// returns checking needs to be done as well

const isApiRequest = (request: TrailStruct) => {
  if (request.origin.napp === '@artifact/api') {
    return true
  }
  return false
}

const entries = (data: TrailStruct) => {
  return Object.entries(data.requests).map(([index, request]) =>
    [Number(index), request] as const
  )
}
