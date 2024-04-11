import IOChannel from '../io/io-channel.ts'
import { getPoolKey } from '@/keys.ts'
import { C, ExeResult, SolidRequest } from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import { Outcome, Request } from '@/constants.ts'
import { assert, Debug, equal, serializeError } from '@utils'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
import { PID } from '@/api/web-client.types.ts'
const log = Debug('AI:exe')

export default class Executor {
  #functions = new Map<string, Execution>()
  static createCacheContext() {
    return new Executor()
  }
  async execute(req: SolidRequest, commit: string, c: C): Promise<ExeResult> {
    const fs = FS.open(req.target, commit, c.db)
    assert(equal(fs.pid, req.target), 'target is not self')
    assert(!fs.isChanged, 'fs is changed')
    const io = await IOChannel.load(fs)
    assert(io.isNextSerialRequest(req), 'request is not callable')
    log('request %o %o', req.isolate, req.functionName)

    const ioAccumulator = io.getAccumulator()

    // if this is a side effect, we need to get the side effect lock
    // then this check needs to be added into everything that the api does
    // we need to start watching for changes to the lock value

    const exeId: string = getExeId(req)
    if (!this.#functions.has(exeId)) {
      // TODO the api needs to be updated with later context and fs
      log('creating execution %o', exeId)
      const opts = { isEffect: true, isEffectRecovered: false }
      // TODO read side effect config from io.json
      const isolateApi = IsolateApi.create(fs, ioAccumulator, opts)
      if (isSystem(fs.pid)) {
        isolateApi.context = c
      }
      const compartment = await Compartment.create(req.isolate)
      const functions = compartment.functions(isolateApi)
      const execution = {
        function: Promise.resolve().then(() => {
          return functions[req.functionName](req.params)
        }).then((result) => {
          const outcome: Outcome = {}
          if (result !== undefined) {
            outcome.result = result
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
        accumulator: ioAccumulator,
        api: isolateApi,
        commit: fs.commit,
      }
      this.#functions.set(exeId, execution)
    } else {
      const execution = this.#functions.get(exeId)
      assert(execution, 'execution not found')
      if (execution.commit === fs.commit) {
        // TODO also detect if was an old commit using accumulator layers
        // TODO exe should be idempotent
        throw new Error('request already executed for commit: ' + fs.commit)
      }
    }
    log('running execution %o', exeId)
    const execution = this.#functions.get(exeId)
    assert(execution, 'execution not found')

    execution.commit = fs.commit
    execution.accumulator.absorb(ioAccumulator)

    const accumulatorPromise = execution.accumulator.activate()
    const winner = await Promise.race([execution.function, accumulatorPromise])
    execution.accumulator.deactivate()

    let result: ExeResult
    if (isOutcome(winner)) {
      log('exe complete %o', exeId)
      this.#functions.delete(exeId)
      const sequence = io.getSequence(req)
      const reply = { target: fs.pid, sequence, outcome: winner }

      // TODO need to tick the fs forwards when the accumulations occur
      result = { settled: { reply, fs } }
    } else {
      log('accumulator triggered first')
      const { accumulations } = execution.accumulator
      assert(accumulations.length > 0, 'no accumulations')
      const requests = accumulations.map((acc) => acc.request)
      result = { pending: { commit: fs.commit, requests } }
    }
    return result
  }
}

type Execution = {
  function: Promise<Outcome>
  accumulator: Accumulator
  api: IsolateApi
  commit: string
}
const getExeId = (request: Request) => {
  const id = getPoolKey(request)
  return JSON.stringify(id)
}
const isOutcome = (value: unknown): value is Outcome => {
  return typeof value === 'object' && value !== null &&
    ('result' in value || 'error' in value) &&
    !('result' in value && 'error' in value)
}
const isSystem = (pid: PID) => {
  const { id, account, repository } = pid
  return id === '__system' && account === 'system' && repository === 'system'
}
