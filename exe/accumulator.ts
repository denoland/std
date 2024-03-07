import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal } from '@utils'

export default class Accumulator {
  #buffer: IsolatePromise[] = []
  #isArmed = true
  #trigger!: () => void
  static create(buffer: IsolatePromise[] = []) {
    const acc = new Accumulator()
    acc.#buffer = buffer
    return acc
  }
  get accumulations() {
    return [...this.#buffer]
  }
  push(request: IsolatePromise) {
    assert(!this.isArmed, 'Alarm is set')
    this.#trigger()
    this.#buffer.push(request)
  }
  recover(index: number) {
    assert(!this.isArmed, 'Alarm is set')
    return this.#buffer[index]
  }
  await() {
    // a promise that resolves when the accumulator is triggered
    assert(this.isArmed, 'Alarm is not set')
    this.#isArmed = false
    return new Promise<void>((resolve) => {
      this.#trigger = resolve
    })
  }
  arm() {
    // any more attempts to accumulate will cause an explosive failure
    this.#isArmed = true
  }
  get isArmed() {
    return this.#isArmed
  }
  absorb(from: Accumulator) {
    assert(this.isArmed, 'this is not alarmed')
    assert(from.isArmed, 'from is not alarmed')
    assert(this.#buffer.length <= from.#buffer.length, 'this must be shorter')
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
