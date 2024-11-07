import { type Action, actionSchema, outcomeSchema } from '@artifact/api/actions'
import equal from 'fast-deep-equal'
import { assert } from '@std/assert/assert'
import { z } from 'zod'
import { deserializeError } from 'serialize-error'

type HookedPromise<T = unknown> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

const sequence = z.number().int().gte(0)

const baseTrailSchema = z.object({
  sequence,
  origin: actionSchema,
  outcome: outcomeSchema.optional(),
})
type TrailStruct = z.infer<typeof baseTrailSchema> & {
  requests: Record<number, TrailStruct>
}

const trailSchema: z.ZodType<TrailStruct> = baseTrailSchema.extend({
  requests: z.lazy(() => z.record(sequence, trailSchema)),
}).refine((data) => {
  for (const index in data.requests) {
    if (Number(index) >= data.sequence) {
      return false
    }
  }
  return true
}, { message: 'Request index must be less than sequence' })

export class Trail {
  static create(origin: Action) {
    return new Trail({ origin, sequence: 0, requests: {} })
  }
  static recreate(data: TrailStruct) {
    return new Trail(data)
  }
  private constructor(data: TrailStruct) {
    this.#data = data
  }

  #index = 0
  #data: TrailStruct
  #trigger: (() => void) | undefined
  #hooks: Record<number, HookedPromise> = {}

  activate(symbol: symbol, data?: TrailStruct) {
    assert(!this.#trigger, 'Trail is active')
    if (data) {
      this.#absorb(data)
    }
    const triggered = new Promise<symbol>((resolve) => {
      this.#trigger = () => resolve(symbol)
    })
    return triggered
  }
  deactivate() {
    assert(this.#trigger, 'Trail is not active')
    this.#trigger = undefined
  }
  #checkTrigger() {
    if (this.#trigger) {
      this.#trigger()
      return
    }
    throw new Error('Trail is not active')
  }
  /** If there is a stored response, will be returned here */
  push(action: Action) {
    this.#checkTrigger()
    const index = this.#index++
    const existing = this.#data.requests[index]
    if (existing) {
      if (!equal(existing.origin, action)) {
        throw new Error('Action mismatch at sequence ' + index)
      }
      if (existing.outcome) {
        if (existing.outcome?.error) {
          const error = deserializeError(existing.outcome.error)
          return Promise.reject(error)
        }
        return Promise.resolve(existing.outcome.result)
      }
    } else {
      this.#data.requests[index] = { sequence: 0, origin: action, requests: {} }
    }
    return this.#hookPromise(index)
  }
  #hookPromise(index: number) {
    assert(index >= 0, 'Index must be >= 0')
    assert(!(index in this.#hooks), 'Promise already exists: ' + index)
    const hook = {} as HookedPromise
    hook.promise = new Promise((resolve, reject) => {
      hook.resolve = resolve
      hook.reject = reject
    })
    this.#hooks[index] = hook
    return hook.promise
  }
  /**
   * Used so that an execution can be paused, then receive replies for
   * accumulated actions, then continue without restarting the execution.  Makes
   * it easier to debug these functions, but also can be faster to execute.
   * This is a nice to have and the operation is equally capable of starting
   * again, if we find ourselves replaying the operation with no existing cache.
   */
  #absorb(data: TrailStruct) {
    assert(!this.#trigger, 'Trail is active')
    // roll thru and extend out the requests, satisfy the replies, and update
    // any promises that were stored.
    assert(equal(data.origin, this.#data.origin), 'Trail origin mismatch')
    assert(data.sequence >= this.#data.sequence, 'Sequence must be >= this')

    for (const [string, request] of Object.entries(data.requests)) {
      const index = Number(string)
      const existing = this.#data.requests[index]

      if (existing) {
        // TODO test that the incoming change is at least as big
        assert(equal(request.origin, existing.origin), 'Action mismatch')
        if (existing.outcome) {
          assert(equal(request, existing), 'Trail mismatch')
        } else {
          if (request.outcome) {
            const hook = this.#hooks[index]
            assert(hook, 'Promise not found: ' + index)
            if (request.outcome.error) {
              const error = deserializeError(request.outcome.error)
              hook.reject(error)
            } else {
              hook.resolve(request.outcome.result)
            }
            delete this.#hooks[index]
          }
        }
      }
      this.#data.requests[index] = request
    }
    this.#data.sequence = data.sequence
  }
  export() {
    assert(!this.#trigger, 'Trail is active')
    return structuredClone(this.#data)
  }
}

/**
 * Wraps the Trail, and on the way in, it will intercept any filesystem items,
 * so that it can fulfill the contents from the fs.  This means the data
 * structure never carries file data, but that file contents are always passed
 * back to the executing function efficiently.
 */
export class FilesProxy {
}
