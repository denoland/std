import IOChannel from '../io/io-channel.ts'
import { getPoolKey } from '@/keys.ts'
import { ExeResult, SolidRequest } from '@/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import { Outcome, Request } from '@/constants.ts'
import { assert, Debug, equal, serializeError } from '@utils'
import Accumulator from '@/exe/accumulator.ts'
import FS from '@/git/fs.ts'
const log = Debug('AI:exe')

export default class Executor {
  #functions = new Map<string, Execution>()
  static createCache() {
    return new Executor()
  }
  async execute(req: SolidRequest, fs: FS): Promise<ExeResult> {
    assert(equal(fs.pid, req.target), 'target is not self')
    assert(!fs.isChanged, 'fs is changed')
    const io = await IOChannel.load(fs)
    assert(io.isCallable(req), 'request is not callable')
    log('request %o %o', req.isolate, req.functionName)

    const ioAccumulator = io.getAccumulator()

    const exeId: string = getExeId(req)
    if (!this.#functions.has(exeId)) {
      log('creating execution %o', exeId)
      const isolateApi = IsolateApi.create(fs, ioAccumulator)
      const compartment = await Compartment.create(req.isolate)
      const functions = compartment.functions(isolateApi)
      const execution = {
        function: Promise.resolve().then(() => {
          return functions[req.functionName](req.params)
        }).then((result) => {
          const outcome: Outcome = { result }
          log('self result: %o', outcome.result)
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
    }
    log('running execution %o', exeId)
    const execution = this.#functions.get(exeId)
    assert(execution, 'execution not found')
    if (execution.commit === fs.commit) {
      // TODO exe should be idempotent - its cache should just return if its
      // seen this combination of commit and request before as we don't know if
      // the queue errored before the result was committed
      throw new Error('request already executed for commit: ' + fs.commit)
    }
    // TODO check exe can handle being called twice without moving the
    // accumulator
    execution.commit = fs.commit
    execution.accumulator.absorb(ioAccumulator)

    const accumulatorPromise = execution.accumulator.await()
    const winner = await Promise.race([execution.function, accumulatorPromise])

    const result: ExeResult = {}
    if (isOutcome(winner)) {
      const sequence = io.getSequence(req)
      log('exe complete %o', exeId)
      this.#functions.delete(exeId)
      const reply = { target: fs.pid, sequence, outcome: winner }

      // TODO need to tick the fs forwards when the accumulations occur
      result.settled = { reply, fs }
    } else {
      log('accumulator triggered first')
      const { accumulations } = execution.accumulator
      assert(accumulations.length > 0, 'no accumulations')
      const requests = accumulations.map((acc) => acc.request)
      result.pending = { commit: fs.commit, requests }
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
