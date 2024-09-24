import { pushable } from 'it-pushable'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { deserializeError } from 'serialize-error'
import {
  backchatIdRegex,
  EngineInterface,
  freezePid,
  JsonValue,
  Params,
  PID,
  Pierce,
  Splice,
  TreeEntry,
} from './types.ts'
import { assert } from '@sindresorhus/is'
import { Crypto } from './crypto.ts'

export class WebClientEngine implements EngineInterface {
  readonly #url: string
  readonly #aborts = new Set<AbortController>()
  readonly #abort = new AbortController()
  readonly #fetcher: (
    input: URL | RequestInfo,
    init?: RequestInit,
  ) => Promise<Response>
  readonly #homeAddress: PID
  readonly #schemas = new Map<string, object>()
  private constructor(url: string, fetcher: typeof fetch, homeAddress: PID) {
    if (url.endsWith('/')) {
      throw new Error('url should not end with "/": ' + url)
    }
    this.#url = url
    this.#fetcher = fetcher
    this.#homeAddress = homeAddress
  }
  static async start(url: string, fetcher?: typeof fetch) {
    if (!fetcher) {
      fetcher = (request, opts) => fetch(request, opts)
    }

    const homeAddress = await request(fetcher, 'homeAddress', {}, { url })
    freezePid(homeAddress)
    return new WebClientEngine(url, fetcher, homeAddress)
  }
  get homeAddress() {
    return this.#homeAddress
  }
  get abortSignal() {
    return this.#abort.signal
  }
  upsertBackchat(machineId: string, resume?: string): Promise<PID> {
    Crypto.assert(machineId)
    const params: { machineId: string; resume?: string } = { machineId, resume }
    if (resume) {
      assert.truthy(backchatIdRegex.test(resume), 'invalid resume')
    }
    return this.#request('upsertBackchat', params)
  }
  stop() {
    this.#abort.abort()
    for (const abort of this.#aborts) {
      abort.abort('Engine stop')
    }
  }
  async ping(data?: JsonValue) {
    // TODO move back to everything being params rather than args
    let params = {}
    if (data) {
      params = { data }
    }
    const result = await this.#request('ping', params)
    if ('data' in result) {
      return result.data
    }
  }
  async pierce(pierce: Pierce) {
    // TODO lock to only allowing a backchat branch to pierce
    await this.#request('pierce', pierce)
  }
  async apiSchema(isolate: string) {
    if (!isolate || typeof isolate !== 'string') {
      throw new Error('isolate string is required')
    }
    if (this.#schemas.has(isolate)) {
      return this.#schemas.get(isolate)
    }
    // TODO rely on the webcache
    const result = await this.#request('apiSchema', { isolate })
    this.#schemas.set(isolate, result)
    return result
  }
  async transcribe(audio: File) {
    const formData = new FormData()
    formData.append('audio', audio)
    const abort = new AbortController()
    this.#aborts.add(abort)
    const request = new Request(`${this.#url}/api/transcribe`, {
      method: 'POST',
      body: formData,
      signal: abort.signal,
    })
    const response = await this.#fetcher(request)

    const outcome = await response.json()
    if (outcome.error) {
      throw deserializeError(outcome.error)
    }
    return outcome.result
  }
  watch(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
    const abort = new AbortController()
    this.#aborts.add(abort)
    if (signal) {
      signal.addEventListener('abort', () => {
        abort.abort()
      })
    }

    const source = pushable<Splice>({ objectMode: true })
    abort.signal.addEventListener('abort', () => source.return())

    const pipe = async () => {
      let lastSplice: Splice | undefined
      let retryCount = 0
      while (!abort.signal.aborted) {
        try {
          const request = new Request(`${this.#url}/api/watch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pid,
              path,
              after: lastSplice?.oid || after,
            }),
            signal: abort.signal,
            keepalive: true,
          })
          const response = await this.#fetcher(request)
          if (!response.ok) {
            throw new Error('response not ok')
          }
          if (!response.body) {
            throw new Error('response body is missing')
          }
          retryCount = 0
          const spliceStream = toEvents(response.body)
          for await (const value of toIterable(spliceStream, abort.signal)) {
            if (value.event === 'splice') {
              const splice: Splice = JSON.parse(value.data)
              lastSplice = splice
              source.push(splice)
            } else {
              console.error('unexpected event', value.event, value)
            }
          }
        } catch (error) {
          console.log('stream error:', error)
        }
        if (!abort.signal.aborted) {
          retryCount++
          const wait = Math.min(1000 * 2 ** retryCount, 30000)
          console.log(`retrying read in ${wait}ms`)
          await new Promise((resolve) => setTimeout(resolve, wait))
        }
      }
    }
    pipe().catch(source.throw)
    return source
  }
  async read(path: string, pid: PID, commit?: string) {
    const params: { path: string; pid: PID; commit?: string } = {
      path,
      pid,
      commit,
    }
    const result = await this.#request('read', params, { cache: !!commit })
    return result as string
  }
  async readTree(path: string, pid: PID, commit?: string) {
    const params: { path: string; pid: PID; commit?: string } = {
      path,
      pid,
      commit,
    }
    const result = await this.#request('readTree', params, { cache: !!commit })
    assert.array(result)
    return result as TreeEntry[]
  }
  async readJSON<T>(path: string, pid: PID, commit?: string) {
    const params: { path: string; pid: PID; commit?: string } = {
      path,
      pid,
      commit,
    }
    // TODO read the string from server then convert locally
    const result = await this.#request('readJSON', params, { cache: !!commit })
    return result as T
  }
  async splice(
    target: PID,
    opts: { commit?: string; path?: string; count?: number } = {},
  ) {
    const params = { target, opts }
    const cache = !!opts.commit
    const result = await this.#request('splice', params, { cache })
    // TODO run zod schema check
    return result as Splice[]
  }
  async exists(path: string, pid: PID) {
    const result = await this.#request('exists', { path, pid })
    return result as boolean
  }
  async #request(path: string, params: Params, opts: { cache?: boolean } = {}) {
    const abort = new AbortController()
    this.#aborts.add(abort)
    const { signal } = abort
    const cache = opts.cache
    try {
      const result = await request(this.#fetcher, path, params, {
        url: this.#url,
        signal,
        cache,
      })
      return result
    } finally {
      this.#aborts.delete(abort)
    }
  }
}
const request = async (
  fetcher: typeof fetch,
  path: string,
  params: Params,
  opts: { url: string; signal?: AbortSignal; cache?: boolean },
) => {
  const request = new Request(`${opts.url}/api/${path}?pretty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: opts.signal,
  })
  let response: Response | undefined
  let cache: Cache | undefined
  if (opts.cache) {
    cache = await globalThis.caches.open('web-client-engine')
    response = await cache.match(toGetRequest(request, params))
  }
  if (!response) {
    response = await fetcher(request)
    if (!response.ok) {
      await response.body?.cancel()
      const { status, statusText } = response
      const msg = `${path} ${JSON.stringify(params)} ${status} ${statusText}`
      throw new Error(msg)
    }
    if (cache) {
      cache.put(toGetRequest(request, params), response.clone())
    }
  } else {
    console.log('cache hit', path, params)
  }

  const outcome = await response.json()
  if (outcome.error) {
    throw deserializeError(outcome.error)
  }
  return outcome.result
}
const toEvents = (stream: ReadableStream) =>
  stream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())

async function* toIterable(stream: ReadableStream, signal: AbortSignal) {
  const reader = stream.getReader()
  signal.addEventListener('abort', () => stream.locked && reader.cancel())
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

const toGetRequest = (request: Request, params: Record<string, unknown>) => {
  const url = request.url + '/' + JSON.stringify(params)
  return new Request(url, { method: 'GET' })
}
