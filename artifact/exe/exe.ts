import IOFile from '../io/io-file.ts'
import { getPoolKey } from '@/artifact/keys.ts'
import { IsolatePromise, Poolable, SolidReply } from '@/artifact/constants.ts'
import IsolateApi from '../isolate-api.ts'
import Compartment from '../io/compartment.ts'
import { IFs, Outcome, Request } from '@/artifact/constants.ts'
import {
  deserializeError,
  serializeError,
} from 'https://esm.sh/serialize-error'
import { Debug, equal } from '@utils'
import { assert } from 'https://deno.land/std@0.217.0/assert/assert.ts'
import { PID } from '@/artifact/constants.ts'
const log = Debug('AI:exe')
type Execute = (
  pid: PID,
  commit: string,
  request: Request,
  fs: IFs,
  induct: (poolable: Poolable) => Promise<void>,
) => Promise<boolean>

/**
 * We expect the execlock has already been acquired, giving this function
 * authority to operate.
 * @param pid
 * @param commit
 * @param request
 * @param fs
 * @param induct
 * @returns true if the request was executed, false if it was deferred
 */
export const execute: Execute = async (pid, commit, request, fs, induct) => {
  assert(equal(pid, request.target), 'target is not self')
  const ioFile = await IOFile.load(pid, fs, commit)
  assert(ioFile.isCallable(request), 'request is not callable')
  log('request %o %o', request.isolate, request.functionName)

  const accumulator = ioFile.getAccumulator()
  log('replies %o', accumulator)

  const exeId = getExeId(request)
  let execution: Execution
  if (runningFunctions.has(exeId)) {
    log('running function %o', exeId)
    execution = runningFunctions.get(exeId)!
    mergeAccumulators(accumulator, execution.accumulator)
  } else {
    const isolateApi = IsolateApi.create(fs, commit, pid, accumulator)
    const compartment = await Compartment.create(request.isolate)
    const functions = compartment.functions(isolateApi)
    execution = {
      function: Promise.resolve().then(() => {
        return functions[request.functionName](request.params)
      }).then((result) => {
        const outcome: Outcome = { result }
        log('self result: %o', outcome.result)
        return outcome
      }).catch((error) => {
        // TODO cancel all outstanding requests
        // and transmit them to the chains that are running them
        log('self error', error.message)
        const outcome: Outcome = { error: serializeError(error) }
        return outcome
      }),
      accumulator,
    }
    runningFunctions.set(exeId, execution)
  }

  const racecar = Symbol('racecar')
  const racer = new Promise((r) => setTimeout(() => r(racecar), 0))
  const winner = await Promise.race([execution.function, racer])
  if (winner === racecar) {
    // TODO throw if no actions but racecar won
    for (const accumulation of accumulator) {
      log('racecar action', accumulation.request)
      await induct(accumulation.request)
    }
    return false
  }
  assert(isOutcome(winner), 'winner is not an outcome')
  const sequence = ioFile.getSequence(request)
  const reply: SolidReply = { target: pid, sequence, outcome: winner }
  await induct(reply)
  return true
}

// TODO move to making an execution context to provide isolation
export const _blankRunningFunctions = () => runningFunctions.clear()

const runningFunctions = new Map<string, Execution>()

type Execution = {
  function: Promise<Outcome>
  accumulator: IsolatePromise[]
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
const mergeAccumulators = (from: IsolatePromise[], to: IsolatePromise[]) => {
  assert(from.length <= to.length, 'to is shorter than from')
  let index = 0
  for (const source of from) {
    const sink = to[index++]
    if (!sink) {
      to.push(source)
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
