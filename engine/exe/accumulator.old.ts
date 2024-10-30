import {
  META_SYMBOL,
  PID,
  PromisedIsolatePromise,
  SettledIsolatePromise,
  UnsequencedRequest,
} from '../constants.ts'
import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal, expect } from '@utils'
import FS from '@/git/fs.ts'
import { MetaPromise } from '@artifact/api/types'

export type IsolatePromise =
  | BareIsolatePromise
  | PromisedIsolatePromise
  | SettledIsolatePromise
type BareIsolatePromise = {
  request: UnsequencedRequest
}
export type PromisedIsolatePromise<T = unknown> = BareIsolatePromise & {
  promise: MetaPromise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}
export type SettledIsolatePromise<T = unknown> =
  & (BareIsolatePromise | PromisedIsolatePromise<T>)
  & {
    outcome: Outcome
    /** if an outcome is given, there must be a commit associated with it, so
     * that the execution filesystem can be ticked forwards */
    commit: string
    /** If the outcome was the result of a branch returning, then the parent
     * commit of that branch is given here */
    parent?: string
  }
export const isSettledIsolatePromise = (
  p: IsolatePromise,
): p is SettledIsolatePromise => {
  return 'outcome' in p
}

export default class Accumulator {
  #index = 0
  #buffer: IsolatePromise[]
  #fs: FS
  #highestFs: FS
  #new: PromisedIsolatePromise[] = []
  #isActive = false
  #trigger: (() => void) | undefined
  private constructor(highestFs: FS, buffer: IsolatePromise[]) {
    this.#buffer = buffer
    this.#highestFs = highestFs
    this.#fs = highestFs
    const [first] = buffer
    if (first) {
      assert('commit' in first, 'first accumulation must have a commit')
      this.#fs = highestFs.tick(first.commit)
    }
  }
  static create(highestFs: FS, buffer: IsolatePromise[] = []) {
    const acc = new Accumulator(highestFs, buffer)
    return acc
  }
  get accumulations() {
    return [...this.#new]
  }
  get fs() {
    return this.#fs
  }
  push(promised: PromisedIsolatePromise) {
    assert(this.isActive, 'Activity is denied')
    assert(typeof this.#trigger === 'function', 'Trigger is not set')
    this.#trigger()
    this.#new.push(promised)
    this.#buffer.push(promised)
  }
  #tickFs() {
    const next = this.#buffer[this.#index]
    if (next && 'commit' in next) {
      this.#fs = this.#fs.tick(next.commit)
    } else if (this.fs.oid !== this.#highestFs.oid) {
      // we are at the final layer, so use the latest fs
      this.#fs = this.#fs.tick(this.#highestFs.oid)
    }
  }
  recover(request: UnsequencedRequest) {
    assert(this.isActive, 'Activity is denied')
    const index = this.#index++
    if (this.#buffer[index]) {
      const recovered = this.#buffer[index]
      if (!equal(recovered.request, request)) {
        expect(recovered.request, 'Requests are not equal').toEqual(request)
      }
      if ('outcome' in recovered) {
        this.#tickFs()
      }
      return recovered
    }
  }
  isParent(parent: string) {
    assert(this.isActive, 'Activity is denied')
    for (const promise of this.#buffer) {
      if ('parent' in promise) {
        if (promise.parent === parent) {
          return true
        }
      }
    }
    return false
  }
  activate(symbol: symbol) {
    assert(!this.isActive, 'Activity is already active')
    assert(!this.#trigger, 'Trigger is already set')
    this.#isActive = true
    return new Promise<symbol>((resolve) => {
      this.#trigger = () => resolve(symbol)
    })
  }
  deactivate() {
    assert(this.isActive, 'Activity is not active')
    this.#isActive = false
    this.#trigger = undefined
  }
  get isActive() {
    return this.#isActive
  }
  /**
   * Used so that an execution can be paused, then receive replies from
   * accumulated actions, then continue without restarting the execution.  Makes
   * it easier to debug these functions, but also can be faster to execute.
   * This is a nice to have and the operation is equally capable of starting
   * again, if we find ourselves replaying the operation with no existing cache.
   *
   * As new layers of the accumulation process occur, the filesystem object
   * referenced by the isolate-api object will tick forwards.
   *
   * @param from The newer accumulator that should be copied in to the old one
   */
  absorb(from: Accumulator) {
    assert(!this.isActive, '"this" is already active')
    assert(!from.isActive, '"from" is already active')
    if (this === from) {
      return
    }
    assert(
      this.#buffer.length <= from.#buffer.length,
      '"this" must be shorter',
    )
    this.#highestFs = from.#highestFs

    let index = 0
    for (const source of from.#buffer) {
      const sink = this.#buffer[index++]
      if (!sink) {
        this.#buffer.push(source)
        continue
      }
      if (!equal(source.request, sink.request)) {
        expect(source.request).toEqual(sink.request)
      }
      if ('outcome' in sink) {
        assert('outcome' in source, 'source has no outcome')
        assert(equal(source.outcome, sink.outcome), 'outcomes are not equal')
        assert(equal(source.commit, sink.commit), 'commits are not equal')
      } else if ('outcome' in source) {
        const settledSink = sink as SettledIsolatePromise
        settledSink.outcome = source.outcome
        settledSink.commit = source.commit
        settledSink.parent = source.parent
      }
      if ('outcome' in sink && 'promise' in sink) {
        sink.promise[META_SYMBOL] = { parent: sink.parent }
        if (sink.outcome.error) {
          sink.reject(deserializeError(sink.outcome.error))
        } else {
          sink.resolve(sink.outcome.result)
        }
      }
    }
    this.#tickFs()
    // TODO assert the #new matched the incoming updates exactly
    this.#new = []
  }
  isPidExists(pid: PID) {
    // TODO log this action in the buffer and make it replayable
    return this.fs.isPidExists(pid)
  }
}
