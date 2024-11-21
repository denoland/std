import { entries, type Trail, type TrailStruct } from './trail.ts'
import type { NappLocal, Tip } from '@artifact/snapshots/tip'
import { assert } from '@std/assert/assert'
import { type Address, addressSchema } from '@artifact/api/napp-api'

export const resolveLocalFiles = async (trail: Trail, tip: Tip) => {
  const withResolves = trail.export()
  for (const [index, request] of entries(withResolves)) {
    if (isApiRequest(request)) {
      // TODO resolve self addresses
      console.log('local file request')

      const [category, command] = request.origin.tool.split('/')
      switch (category as keyof NappLocal) {
        case 'read': {
          const { path = '.', options: o = {} } = request.origin.parameters
          assert(typeof path === 'string', 'path must be a string')
          const options = addressSchema.parse(o) as Address
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
  return withResolves
}

const isApiRequest = (request: TrailStruct) => {
  if (request.origin.napp === '@artifact/api') {
    return true
  }
  return false
}
