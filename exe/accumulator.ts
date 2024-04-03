import { SolidRequest } from '@/constants.ts'
import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal } from '@utils'

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
  recover(unsequencedRequest: SolidRequest) {
    assert(this.isActive, 'Activity is denied')
    assert(unsequencedRequest.sequence === -1, 'Sequence is not -1')
    const index = this.#index++
    if (this.#buffer[index]) {
      const recovered = this.#buffer[index]
      const test = { ...recovered.request }
      test.sequence = unsequencedRequest.sequence
      assert(equal(test, unsequencedRequest), 'Requests are not equal')
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
      assert(equalButSequence(source.request, sink.request), 'requests')
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

const equalButSequence = (a: SolidRequest, b: SolidRequest) => {
  for (const key of Object.keys(a) as Array<keyof SolidRequest>) {
    if (key === 'sequence') {
      continue
    }
    if (!equal(a[key], b[key])) {
      return false
    }
  }
  return true
}
