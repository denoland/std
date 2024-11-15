import napps from './napps-import.ts'
import {
  type NappApi,
  stateSchema,
  type TreeEntry,
} from '@artifact/api/napp-api'
import Debug from 'debug'
import type { Trail } from './trail.ts'
import { assert } from '@std/assert/assert'
import { type Action, jsonSchema } from '../api/actions.ts'
import type { z } from 'zod'
const log = Debug('@artifact/execution')

export default class Compartment {
  static async load(napp: keyof typeof napps, trail: Trail) {
    await Promise.resolve() // simulates loading from the network
    const compartment = new Compartment(napp, trail)
    compartment.#execute()
    return compartment
  }

  // TODO figure out how to do types cleanly
  // deno-lint-ignore ban-types
  #napp: Record<string, Function>

  readonly #trail: Trail

  private constructor(napp: keyof typeof napps, trail: Trail) {
    log('load napp:', napp, trail)
    if (napp !== trail.origin.napp) {
      throw new Error('Napp mismatch: ' + napp + ' !== ' + trail.origin.napp)
    }
    this.#napp = napps[napp]
    this.#trail = trail
    trail.signal.onabort = () => this.#tearDown()
  }
  async #execute() {
    await this.#trail.waitForActivation()
    try {
      const { tool } = this.#trail.origin
      log('execute', tool)
      if (!(tool in this.#napp)) {
        throw new Error('Tool not found: ' + tool)
      }
      if (typeof this.#napp[tool] !== 'function') {
        throw new Error('Tool is not a function: ' + tool)
      }

      const api = Api.create(this.#trail)
      const result = await this.#napp[tool](this.#trail.origin.parameters, api)
      this.#trail.resolve(result)
    } catch (error) {
      this.#trail.reject(error as Error)
    }
  }
  // what about holding off on the outcome until all the actions were
  // transmitted ?
  // how to send of actions that have no reply ?
  // what if the function completes AFTER the trail trigger ?

  // test firing off some promises then returning, and it should skip those
  // promises as well as ignoring their return values

  #tearDown() {
    log('tear down')
    return Promise.resolve()
  }
  /**
   * Mount the isolate as a side effect, and give it the chance to initialize
   * some context that will get passed between different invocations on the
   * same mount.
   * @param api : IsolateApi
   * @returns Promise<void> | void
   */
  mount(api: NappApi) {
    // TODO use exe to ensure that mount stops working arfter invocation
    if ('@@mount' in this.#napp) {
      assert(typeof this.#napp['@@mount'] === 'function', 'Invalid mount')
      return this.#napp['@@mount'](api)
    }
  }
  /**
   * Unmount the isolate as a side effect, and give it the chance to clean up
   * @param api : IsolateApi
   */
  unmount(api: NappApi) {
    if ('@@unmount' in this.#napp) {
      assert(typeof this.#napp['@@unmount'] === 'function', 'Invalid unmount')
      return this.#napp['@@unmount'](api)
    }
  }
}

class Api implements NappApi {
  // all this thing does is create actions
  // these are then interpreted by whatever is running them
  // so it can be used for client side, inside a napp, or for handling different
  // processes, branches, and remote repositories

  static create(trail: Trail) {
    return new Api(trail)
  }

  private constructor(trail: Trail) {
    this.#state = createState(trail)
    this.#read = createRead(trail)
    this.#write = createWrite(trail)
    this.#processes = createProcesses(trail)
    this.#effects = createEffects(trail)

    Object.freeze(this)
    Object.freeze(this.#state)
    Object.freeze(this.#read)
    Object.freeze(this.#write)
    Object.freeze(this.#processes)
    Object.freeze(this.#effects)
  }

  #state: NappApi['state']
  #read: NappApi['read']
  #write: NappApi['write']
  #processes: NappApi['processes']
  #effects: NappApi['effects']

  get state() {
    return this.#state
  }
  get read() {
    return this.#read
  }
  get write() {
    return this.#write
  }
  get processes() {
    return this.#processes
  }
  get effects() {
    return this.#effects
  }
}

const createState = (trail: Trail) => {
  const state: NappApi['state'] = {
    get: async (options) => {
      const { schema = stateSchema, fallback, ...rest } = options || {}
      const action: Action = {
        napp: '@artifact/api',
        tool: 'state/get',
        parameters: { options: rest },
      }
      const result = await trail.push(action)
      if (result === undefined && fallback !== undefined) {
        return fallback
      }
      return schema.parse(result) as z.infer<typeof schema>
    },
    set: async (state, options) => {
      const { schema = stateSchema, ...rest } = options || {}
      schema.parse(state)
      const action: Action = {
        napp: '@artifact/api',
        tool: 'state/set',
        parameters: { options: rest },
      }
      await trail.push(action, { json: state })
    },
  }
  return state
}

const createRead = (trail: Trail) => {
  const read: NappApi['read'] = {
    meta: (path, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'read/meta',
        parameters: { path, options },
      }
      return trail.push<TreeEntry>(action)
    },
    json: async (path, options) => {
      const { schema = jsonSchema, ...rest } = options || {}
      const text = await read.text(path, rest)
      const object = JSON.parse(text)
      return schema.parse(object) as z.infer<typeof schema>
    },
    text: async (path, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'read/text',
        parameters: { path, options },
      }
      const text = await trail.push<string>(action)
      return text
    },
    binary: async (path, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'read/binary',
        parameters: { path, options },
      }
      const binary = await trail.push<Uint8Array>(action)
      return binary
    },
    exists: async (path, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'read/exists',
        parameters: { path, options },
      }
      const exists = await trail.push<boolean>(action)
      return exists
    },
    ls: async (path = '.', options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'read/ls',
        parameters: { path, options },
      }
      const entries = await trail.push<TreeEntry[]>(action)
      return entries
    },
  }
  return read
}

const createWrite = (trail: Trail) => {
  const write: NappApi['write'] = {
    json: async (path, content, options) => {
      const text = JSON.stringify(content, null, 2)
      await write.text(path, text, options)
    },
    text: async (path, content, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'write/text',
        parameters: { path, options },
      }
      await trail.push(action, { text: content })
    },
    binary: async (path, content, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'write/binary',
        parameters: { path, options },
      }
      await trail.push(action, { data: content })
    },
    rm: async (path, options = {}) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'write/rm',
        parameters: { path, options },
      }
      await trail.push(action)
    },
    mv: async (from, to) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'write/mv',
        parameters: { from, to },
      }
      await trail.push(action)
    },
    cp: async (from, to) => {
      const action: Action = {
        napp: '@artifact/api',
        tool: 'write/cp',
        parameters: { from, to },
      }
      await trail.push(action)
    },
  }
  return write
}

const createProcesses = (trail: Trail) => {
  const processes: NappApi['processes'] = {
    spawn() {
      return Promise.reject('Not implemented')
    },
    kill() {
      return Promise.reject('Not implemented')
    },
    async() {
      return Promise.reject('Not implemented')
    },
    mv() {
      return Promise.reject('Not implemented')
    },
    nice() {
      return Promise.reject('Not implemented')
    },
    dispatch: async (action, options) => {
      const _action = { ...action, files: action.files || [] }
      const wrapped: Action = {
        napp: '@artifact/api',
        tool: 'processes/dispatch',
        parameters: { action: _action, options },
      }
      // ?? how to send up the list of files that were provided ?
      // ? what if they were part of tip and had not yet been committed ?
      return trail.push(wrapped)
    },
    dispatchWithMeta: async (action, options) => {
      return Promise.reject('Not implemented')
    },
  }
  return processes
}

const createEffects = (trail: Trail) => {
  const effects: NappApi['effects'] = {
    get signal() {
      return trail.signal
    },
    get isEffectRecovered() {
      return false // TODO
    },
    set context(value) {
      trail.context = value
    },
    get context() {
      return trail.context
    },
  }
  return effects
}
