import {
  type Action,
  actionSchema,
  type JsonValue,
  type Outcome,
  outcomeSchema,
} from '@artifact/api/actions'
import type { Upsert } from '@artifact/api/napp-api'
import equal from 'fast-deep-equal'
import { assert } from '@std/assert/assert'
import { z } from 'zod'
import { deserializeError, serializeError } from 'serialize-error'
import Debug from 'debug'
import { expect } from '@std/expect/expect'
const log = Debug('@artifact/execution')

export const DEFAULT_TIMEOUT = 200
export enum TrailStopReason {
  Triggered,
  Settled,
}

const sequence = z.number().int().gte(0)

const baseTrailSchema = z.object({
  sequence,
  origin: actionSchema,
  outcome: outcomeSchema.optional(),
  activeMs: z.number().int().gte(0),
  options: z.object({
    /** Maximum execution time between async operations that we will wait */
    timeout: z.number().int().gte(0),
  }),
})
export type TrailStruct = z.infer<typeof baseTrailSchema> & {
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
    return new Trail({
      origin,
      sequence: 0,
      requests: {},
      activeMs: 0,
      options: { timeout: DEFAULT_TIMEOUT },
    })
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
  #hooks: Record<number, ReturnType<typeof hookPromise>> = {}

  #subscribers: Set<() => void> = new Set()

  #abort = new AbortController()
  #settled = hookPromise<void>()

  #context: unknown

  #payloads: Record<number, Upsert> = {}

  hasPayload(index: number) {
    return index in this.#payloads
  }
  injectPayload(index: number, upsert: Upsert) {
    assert(!this.#payloads[index], 'Payload already exists: ' + index)
    Object.freeze(upsert)
    this.#payloads[index] = upsert
  }
  extractPayload(index: number) {
    const payload = this.#payloads[index]
    if (!payload) {
      throw new Error('Payload not found: ' + index)
    }
    delete this.#payloads[index]
    return payload
  }
  get origin() {
    return this.#data.origin
  }
  get signal() {
    return this.#abort.signal
  }
  get context() {
    // TODO check if this is a valid side effect
    return this.#context
  }
  set context(value: unknown) {
    this.#context = value
  }

  abort() {
    assert(!this.#trigger, 'Trail is active')
    this.#abort.abort()
  }

  waitForOutcome() {
    return this.#settled.promise
  }

  waitForActivation() {
    assert(!this.#trigger, 'Trail is active')
    return new Promise<void>((resolve) => {
      this.#subscribers.add(resolve)
    })
  }

  resolve(result: JsonValue | undefined) {
    assert(!this.#data.outcome, 'Trail is already settled')
    log('resolving')
    this.#settled.resolve()
    const outcome: Outcome = {}
    if (result !== undefined) {
      outcome.result = result
    }
    this.#data.outcome = outcome
  }
  reject(error: Error) {
    assert(!this.#data.outcome, 'Trail is already settled')
    log('rejecting')
    this.#settled.resolve()
    const outcome: Outcome = { error: serializeError(error) }
    this.#data.outcome = outcome
  }

  async activate(data?: TrailStruct) {
    assert(!this.signal.aborted, 'Trail is aborted')
    assert(!this.#trigger, 'Trail is active')
    if (this.#data.outcome || data?.outcome) {
      throw new Error('Trail is already settled')
    }

    if (data) {
      this.#absorb(data)
    }

    const triggered = Symbol('🔫')
    const triggeredPromise = new Promise<symbol>((resolve) => {
      this.#trigger = () => resolve(triggered)
    })
    const timeout = Symbol('⏰')
    let timeoutId: number | undefined
    const timeoutPromise = new Promise<symbol>((resolve) => {
      const remainingMs = this.#data.options.timeout - this.#data.activeMs
      timeoutId = setTimeout(() => resolve(timeout), remainingMs)
    })
    const settled = Symbol('🏁')
    const settledPromise = this.#settled.promise.then(() => settled)

    for (const resolve of this.#subscribers) {
      resolve()
    }
    this.#subscribers.clear()

    const start = Date.now()

    const result = await Promise.race([
      settledPromise,
      triggeredPromise,
      timeoutPromise,
    ])
    const end = Date.now()
    this.#data.activeMs += end - start
    this.#deactivate()
    log('clearing timeout')
    clearTimeout(timeoutId)

    // if timeout, then we should end with an error ?

    if (result === timeout) {
      this.reject(new Error(`Timeout of ${this.#data.options.timeout} ms`))
      return TrailStopReason.Settled
    }
    if (result === triggered) {
      return TrailStopReason.Triggered
    }
    if (result === settled) {
      return TrailStopReason.Settled
    }
    throw new Error('Unknown race result: ' + result.toString())
  }
  #deactivate() {
    assert(this.#trigger, 'Trail is not active')
    this.#trigger = undefined
  }
  #fireTrigger() {
    if (this.#trigger) {
      log('firing trigger')
      this.#trigger()
      return
    }
    throw new Error('Trail is not active')
  }
  /** If there is a stored response, will be returned here */
  push<T>(action: Action, upsert?: Upsert) {
    assert(!this.signal.aborted, 'Trail is aborted')
    assert(this.#trigger, 'Trail is not active')
    const index = this.#index++
    const existing = this.#data.requests[index]
    if (existing) {
      if (!equal(existing.origin, action)) {
        throw new Error('Action mismatch at sequence ' + index)
      }
      // TODO check if the upsert is the same too

      if (existing.outcome) {
        if (existing.outcome.error) {
          const error = deserializeError(existing.outcome.error)
          throw error
        }
        if (this.hasPayload(index)) {
          // if the result includes a payload, then return the payload contents
        }
        return Promise.resolve(existing.outcome.result as T)
      }
    } else {
      this.#data.requests[index] = {
        sequence: 0,
        origin: action,
        requests: {},
        activeMs: 0,
        options: { timeout: DEFAULT_TIMEOUT },
      }
      if (upsert) {
        this.#payloads[index] = upsert
      }
    }
    const hook = this.#hookPromise<T>(index)
    return hook
  }
  #hookPromise<T>(index: number) {
    assert(index >= 0, 'Index must be >= 0')
    assert(!(index in this.#hooks), 'Promise already exists: ' + index)
    this.#fireTrigger()

    const hook = hookPromise<T>()
    this.#hooks[index] = hook as ReturnType<typeof hookPromise>
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
    // roll thru and extend out the requests, satisfy the replies, and update
    // any promises that were stored.
    assert(equal(data.origin, this.#data.origin), 'Trail origin mismatch')
    assert(data.sequence >= this.#data.sequence, 'Sequence must be >= this')
    assert(equal(data.activeMs, this.#data.activeMs), 'Active time mismatch')

    for (const [string, request] of Object.entries(data.requests)) {
      const index = Number(string)
      const existing = this.#data.requests[index]

      if (existing) {
        // TODO test that the incoming change is at least as big
        assert(equal(request.origin, existing.origin), 'Action mismatch')
        if (existing.outcome) {
          if (!equal(request, existing)) {
            expect(request, 'Trail mismatch').toEqual(existing)
          }
        } else {
          if (request.outcome && index < this.#index) {
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

const hookPromise = <T>() => {
  let resolve: (value: T) => void
  let reject: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve!, reject: reject! }
}
