import IOChannel from './io-channel.ts'
import { getExeId } from '@/keys.ts'
import { C, JsonValue, Outcome, SolidReply, SolidRequest } from '@/constants.ts'
import NappApi from '../../api/napp-api.ts'
import Compartment from '../../execution/compartment.ts'
import { assert, Debug, equal, serializeError } from '@utils'
import type Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
const log = Debug('AI:exe')

// Exe interface should simply take an accumulator
// then wrap it in the caching layer to allow executions to be continued

export default class Executor {
  #functions = new Map<string, Execution>()
  #functionCacheDisabled = false
  static createCacheContext() {
    return new Executor()
  }
  disableFunctionCache() {
    this.#functionCacheDisabled = true
  }
  /**
   * @param req
   * @param commit The commit that caused this invocation, which might be the
   * commit of the request, or the commit of the most recent accumulation that
   * allowed this execution to continue.
   * @param c
   * @returns
   */
  async execute(req: SolidRequest, commit: string, c: C): Promise<ExeResult> {
    const fs = FS.open(req.target, commit, c.db)
    assert(equal(fs.pid, req.target), 'target is not self')
    const io = await IOChannel.read(fs)
    assert(io, 'io not found')
    assert(io.isExecution(req), 'request is not callable')
    log('request %o %o', req.isolate, req.functionName, commit)

    const accumulator = io.getAccumulator(fs)

    // if this is a side effect, we need to get the side effect lock
    // then this check needs to be added into everything that the api does
    // we need to start watching for changes to the lock value

    const exeId: string = getExeId(req)
    if (this.#functionCacheDisabled || !this.#functions.has(exeId)) {
      log('creating execution %o', exeId)
      const opts = { isEffect: true, isEffectRecovered: false }
      // TODO read side effect config from io.json
      const { runnable, commit } = io.getExecution()
      assert(runnable, 'origin not found')
      const isolateApi = NappApi.create(accumulator, runnable, commit, opts)
      if (req.isolate === 'system') {
        log('system isolate')
        isolateApi.context = c
      }
      const compartment = await Compartment.create(req.isolate)
      const functions = compartment.functions(isolateApi)
      const execution = {
        function: Promise.resolve().then(() => {
          if (!(req.functionName in functions)) {
            const msg = `isolate: ${req.isolate} function: ${req.functionName}`
            throw new Error('function not found: ' + msg)
          }
          return functions[req.functionName](req.params)
        }).then((result) => {
          const outcome: Outcome = {}
          if (result !== undefined) {
            outcome.result = result as JsonValue // sorry 🤷
            log('self result: %o', outcome.result)
          }
          return outcome
        }).catch((error) => {
          // TODO cancel all outstanding requests
          // and transmit them to the chains that are running them
          log('error', error.message)
          const outcome: Outcome = { error: serializeError(error) }
          return outcome
        }),
        accumulator,
        api: isolateApi,
        commits: [fs.oid],
      }
      this.#functions.set(exeId, execution)
    } else {
      const execution = this.#functions.get(exeId)
      assert(execution, 'execution not found')
      if (execution.commits.includes(fs.oid)) {
        // TODO exe should be idempotent ?
        throw new Error('request already executed for commit: ' + fs.oid)
      }
    }
    log('running execution %o', exeId)
    const execution = this.#functions.get(exeId)
    assert(execution, 'execution not found')

    execution.commits.push(fs.oid)
    execution.accumulator.absorb(accumulator)

    const trigger = Symbol('🏎️')
    const accumulatorPromise = execution.accumulator.activate(trigger)
    const outcome = await Promise.race([
      execution.function,
      accumulatorPromise,
    ])
    execution.accumulator.deactivate()

    let result: ExeResult
    const sequence = io.getSequence(req)
    if (outcome === trigger) {
      const { accumulations } = execution.accumulator
      assert(accumulations.length > 0, 'no accumulations')
      log('accumulator triggered first', accumulations)
      const requests = accumulations.map((a) => a.request)
      result = {
        fs: execution.accumulator.fs,
        pending: { commit: fs.oid, requests, sequence },
      }
    } else {
      assert(typeof outcome === 'object')
      log('exe complete %o', exeId)
      this.#functions.delete(exeId)
      const target = fs.pid
      const reply: SolidReply = { target, sequence, outcome }

      result = { fs: execution.accumulator.fs, reply }
    }
    return result
  }
}

type Execution = {
  function: Promise<Outcome>
  accumulator: Accumulator
  api: NappApi
  commits: string[]
}
export type ExeResult = ExeSettled | ExePending
type ExeResultBase = {
  /**
   * The last filesystem that was modified during the execution run.  The FS
   * might have been bumped forwards if accumulations occurred.
   */
  fs: FS
  /** If this is a side effect request, this is the lock held by for it */
  effectsLock?: Deno.KvEntry<string>
}
type ExeSettled = ExeResultBase & {
  reply: SolidReply
}
type ExePending = ExeResultBase & {
  pending: Pending
}
export type Pending = {
  /** The commit that caused the requests to be generated */
  commit: string
  /** The requests that were generated by the latest round of execution */
  requests: UnsequencedRequest[]
  /** The sequence number to accumulate the pending requests against */
  sequence: number
}
