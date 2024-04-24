import {
  IoStruct,
  SettledIsolatePromise,
  UnsequencedRequest,
} from '@/constants.ts'
import { IsolatePromise } from '@/constants.ts'
import { assert, deserializeError, equal, expect } from '@utils'
import FS from '@/git/fs.ts'

export default class Accumulator {
  #index = 0
  #buffer: IsolatePromise[]
  #fs: FS
  #highestFs: FS
  #new: IsolatePromise[] = []
  #isActive = false
  #trigger: (() => void) | undefined
  private constructor(highestFs: FS, buffer: IsolatePromise[]) {
    this.#highestFs = highestFs
    this.#fs = highestFs
    this.#buffer = buffer
    const [first] = buffer
    if (first) {
      assert('commit' in first, 'first accumulation must have a commit')
      this.#fs = highestFs.tick(first.commit)
    }
  }
  static create(buffer: IsolatePromise[] = [], highestFs: FS) {
    const acc = new Accumulator(highestFs, buffer)
    return acc
  }
  get accumulations() {
    return [...this.#new]
  }
  get fs() {
    return this.#fs
  }
  push(request: IsolatePromise) {
    assert(this.isActive, 'Activity is denied')
    assert(typeof this.#trigger === 'function', 'Trigger is not set')
    this.#trigger()
    this.#new.push(request)
    this.#buffer.push(request)
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
    if (!(this.#buffer.length <= from.#buffer.length)) {
      console.error('this.#fs:', this.#fs.oid, 'from.#fs', from.#fs.oid)
      console.error(
        'this.#highestFs:',
        this.#highestFs.oid,
        'from.#highestFs',
        from.#highestFs.oid,
      )
      this.#fs.readJSON<IoStruct>('.io.json').then((io) =>
        console.dir(io.pendings, { depth: Infinity })
      )
      from.#fs.readJSON<IoStruct>('.io.json').then((io) =>
        console.dir(io.pendings, { depth: Infinity })
      )
      expect(this.#buffer).toEqual(from.#buffer)
    }
    assert(this.#buffer.length <= from.#buffer.length, '"this" must be shorter')
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
      }
      if ('outcome' in sink && 'resolve' in sink) {
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
}
