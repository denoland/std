import { UnsequencedRequest } from '@/constants.ts'
import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal, expect } from '@utils'

export default class Accumulator {
  #index = 0
  #buffer: IsolatePromise[] = []
  #isActive = false
  #trigger: (() => void) | undefined
  private constructor() {}
  static create(buffer: IsolatePromise[] = []) {
    const acc = new Accumulator()
    acc.#buffer = buffer
    return acc
  }
  get accumulations() {
    return [...this.#buffer]
  }
  push(request: IsolatePromise) {
    assert(this.isActive, 'Activity is denied')
    assert(typeof this.#trigger === 'function', 'Trigger is not set')
    this.#trigger()
    this.#buffer.push(request)
  }
  recover(request: UnsequencedRequest) {
    assert(this.isActive, 'Activity is denied')
    const index = this.#index++
    if (this.#buffer[index]) {
      const recovered = this.#buffer[index]
      assert(equal(recovered.request, request), 'Requests are not equal')
      return recovered
    }
  }
  await() {
    // a promise that resolves when the accumulator is triggered
    assert(!this.isActive, 'Activity is already active')
    assert(!this.#trigger, 'Trigger is already set')
    this.#isActive = true
    return new Promise<void>((resolve) => {
      this.#trigger = resolve
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
    assert(this.#buffer.length <= from.#buffer.length, '"this" must be shorter')
    let index = 0
    for (const source of from.#buffer) {
      const sink = this.#buffer[index++]
      if (!sink) {
        this.#buffer.push(source)
        continue
      }
      expect(source.request).toEqual(sink.request)
      assert(equal(source.request, sink.request), 'requests')
      if (sink.outcome) {
        assert(equal(source.outcome, sink.outcome), 'outcomes are not equal')
      } else {
        sink.outcome = source.outcome
      }
      if (sink.outcome && sink.resolve) {
        assert(sink.reject, 'sink has no reject')
        if (sink.outcome.error) {
          sink.reject(deserializeError(sink.outcome.error))
        } else {
          sink.resolve(sink.outcome.result)
        }
      }
    }
  }
}
