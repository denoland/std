import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal } from '@utils'

export default class Accumulator {
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
  recover(index: number) {
    assert(this.isActive, 'Activity is denied')
    return this.#buffer[index]
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
  get isActive() {
    return this.#isActive
  }
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
      assert(equal(source.request, sink.request), 'requests are not equal')
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
