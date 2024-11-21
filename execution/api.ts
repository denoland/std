import {
  type NappApi,
  stateSchema,
  type TreeEntry,
} from '@artifact/api/napp-api'
import Debug from 'debug'
import type { Trail } from './trail.ts'
import { type Action, jsonSchema } from '../api/actions.ts'
import type { z } from 'zod'

export class Api implements NappApi {
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
