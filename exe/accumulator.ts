import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal } from '@utils'

export default class Accumulator {
  #buffer: IsolatePromise[] = []
  // TODO store some checking means of knowing the interactions were the same
  #upserts = new Set<string>()
  #deletes = new Set<string>()
  #isAlarmed = true
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
    assert(!this.isAlarmed, 'Activity is denied')
    this.#trigger()
    this.#buffer.push(request)
  }
  recover(index: number) {
    assert(!this.isAlarmed, 'Activity is denied')
    return this.#buffer[index]
  }
  await() {
    // a promise that resolves when the accumulator is triggered
    assert(this.isAlarmed, 'Alarm is not set')
    this.#isAlarmed = false
    return new Promise<void>((resolve) => {
      this.#trigger = resolve
    })
  }
  arm() {
    // any more attempts to accumulate will cause an explosive failure
    this.#isAlarmed = true
  }
  get isAlarmed() {
    return this.#isAlarmed
  }
  absorb(from: Accumulator) {
    assert(this.isAlarmed, 'this is not alarmed')
    assert(from.isAlarmed, 'from is not alarmed')
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
  get upserts() {
    // TODO must handle deletes, moves, and other types of fun things
    return [...this.#upserts]
  }
  get deletes() {
    return [...this.#deletes]
  }
  write(path: string, file: string | Uint8Array) {
    // trigger broadcast channel updates
    assert(!this.isAlarmed, 'Activity is denied')
    this.#upserts.add(path)
  }
}
