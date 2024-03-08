import { Debug, fromOutcome, serializeError } from '@utils'
import { C } from './isolates/artifact.ts'
import IsolateApi from './isolate-api.ts'
import { IsolateFunctions } from './constants.ts'
import { assert } from '$std/assert/assert.ts'
import { ulid } from '$std/ulid/mod.ts'
import { Outcome } from '@/constants.ts'
import { Params } from '@/constants.ts'
const log = Debug('AI:queue')
type QFunction = { id: string; name: string; params?: Params; detach: boolean }
const twoMinutes = 2 * 60 * 1000
// TODO put in limits to the operations so we don't go broke
// const KV_WRITE_LIMIT = 1e6
// const KV_READ_LIMIT = 1e6

export default class Queue {
  #api!: IsolateApi<C>
  #functions!: IsolateFunctions
  #kv!: Deno.Kv
  static create(functions: IsolateFunctions, api: IsolateApi<C>) {
    // TODO include generics in the queue by making it specifically a cradle q
    const queue = new Queue()
    queue.#api = api
    queue.#functions = functions
    queue.#kv = api.context.db!.kv
    queue.#listen()
    return queue
  }
  // TODO do tampering, like double message delivery, missed messages, delays
  async push<K>(name: string, params?: Params, detach = false) {
    const id = ulid()
    log('push %o', { id, name })
    const msg = { id, name, params, detach }
    const key = ['QUEUE', id, name]
    const stream = this.#kv.watch<Outcome[]>([key])
    this.#stack.add(id)
    await this.#kv.enqueue(msg, { backoffSchedule: [] })
    if (detach) {
      stream.cancel()
      return
    }
    for await (const [event] of stream) {
      if (!event.versionstamp) {
        continue
      }
      this.#updateStack(id)
      const outcome: Outcome = event.value
      return fromOutcome(outcome) as K
    }
  }
  #listen() {
    this.#kv.listenQueue(async (msg: QFunction) => {
      log('listenQueue ', msg.id, msg.name)
      assert(this.#functions[msg.name], `missing ${msg.name}`)
      // TODO make the queue include types on the params
      // possibly with strong assertion checking
      const { id, name, params = {}, detach } = msg
      const outcomeKey = ['QUEUE', id, name]
      const key = [...outcomeKey, 'pending']
      // TODO rely on the artifact functions to handle double delivery

      const result = await this.#kv.atomic().check({ key, versionstamp: null })
        .set(key, true, { expireIn: twoMinutes }).commit()
      if (!result.ok) {
        log('already processing', id, name)
        return
      }
      const outcome: Outcome = {}
      try {
        // TODO will the queue wait forever ?
        outcome.result = await this.#functions[name](params, this.#api)
      } catch (error) {
        console.error('Queue Error:', error.message)
        outcome.error = serializeError(error)
      }
      await this.#kv.set(outcomeKey, outcome, { expireIn: twoMinutes })
      if (detach) {
        this.#updateStack(id)
      }
    })
  }
  async #updateStack(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    const isDeleted = this.#stack.delete(id)
    log('updateStack', id, isDeleted, this.#stack.size)
    if (this.#stack.size === 0 && this.#quiesce.zero) {
      this.#quiesce.zero()
      delete this.#quiesce.zero
      delete this.#quiesce.waitingForZero
    }
  }
  #stack = new Set()
  #quiesce = {
    zero: undefined as undefined | (() => void),
    waitingForZero: undefined as Promise<void> | undefined,
  }
  quiesce() {
    if (this.#stack.size === 0 && !this.#quiesce.waitingForZero) {
      return
    }
    log('quiesce', this.#stack.size)
    if (!this.#quiesce.zero) {
      this.#quiesce.waitingForZero = new Promise<void>((resolve) => {
        this.#quiesce.zero = resolve
      })
    }
    return this.#quiesce.waitingForZero
  }
}
