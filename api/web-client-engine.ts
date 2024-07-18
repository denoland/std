import { pushable } from 'it-pushable'
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { deserializeError } from 'serialize-error'
import {
  backchatIdRegex,
  EngineInterface,
  freezePid,
  JSONSchemaType,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  Splice,
} from './web-client.types.ts'
import { assert } from '@sindresorhus/is'
import { Crypto } from './web-client-crypto.ts'

export class WebClientEngine implements EngineInterface {
  readonly #aborts = new Set<AbortController>()
  readonly #abort = new AbortController()
  readonly #fetcher: (
    input: URL | RequestInfo,
    init?: RequestInit,
  ) => Promise<Response>
  readonly #homeAddress: PID
  readonly #schemas = new Map<string, JSONSchemaType<object>>()
  private constructor(url: string, fetcher: typeof fetch, homeAddress: PID) {
    if (url.endsWith('/')) {
      throw new Error('url should not end with "/": ' + url)
    }
    this.#fetcher = fetcher
    this.#homeAddress = homeAddress
  }
  static async start(url: string, fetcher?: typeof fetch) {
    if (!fetcher) {
      fetcher = (path, opts) => fetch(`${url}${path}`, opts)
    }

    const homeAddress = await request(fetcher, 'homeAddress', {})
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
  async pierce(pierce: PierceRequest) {
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
    const result = await this.#request('apiSchema', { isolate })
    this.#schemas.set(isolate, result)
    return result
  }
  async transcribe(audio: File) {
    const formData = new FormData()
    formData.append('audio', audio)
    const abort = new AbortController()
    this.#aborts.add(abort)
    const response = await this.#fetcher(`/api/transcribe`, {
      method: 'POST',
      body: formData,
      signal: abort.signal,
    })

    const outcome = await response.json()
    if (outcome.error) {
      throw deserializeError(outcome.error)
    }
    return outcome.result
  }
  read(pid: PID, path?: string, after?: string, signal?: AbortSignal) {
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
          const response = await this.#fetcher(`/api/read`, {
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
          if (!response.ok) {
            throw new Error('response not ok')
          }
          if (!response.body) {
            throw new Error('response body is missing')
          }
          const spliceStream = toEvents(response.body)
          for await (const value of toIterable(spliceStream, abort.signal)) {
            if (value.event === 'splice') {
              const splice: Splice = JSON.parse(value.data)
              lastSplice = splice
              source.push(splice)
            } else {
              console.error('unexpected event', value.event, value)
            }
            retryCount = 0
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
  async readJSON<T>(path: string, pid: PID, commit?: string) {
    const params: { path: string; pid: PID; commit?: string } = {
      path,
      pid,
      commit,
    }
    const result = await this.#request('readJSON', params)
    return result as T
  }
  async exists(path: string, pid: PID) {
    const result = await this.#request('exists', { path, pid })
    return result as boolean
  }
  async #request(path: string, params: Params) {
    const abort = new AbortController()
    this.#aborts.add(abort)
    try {
      return await request(this.#fetcher, path, params, abort.signal)
    } finally {
      this.#aborts.delete(abort)
    }
  }
}
const request = async (
  fetcher: typeof fetch,
  path: string,
  params: Params,
  signal?: AbortSignal,
) => {
  const response = await fetcher(`/api/${path}?pretty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })
  if (!response.ok) {
    await response.body?.cancel()
    const { status, statusText } = response
    const msg = `${path} ${JSON.stringify(params)} ${status} ${statusText}`
    throw new Error(msg)
  }
  const outcome = await response.json()
  if (outcome.error) {
    throw deserializeError(outcome.error)
  }
  return outcome.result
}
const toEvents = (stream: ReadableStream) =>
  stream.pipeThrough(new TextDecoderStream())
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
