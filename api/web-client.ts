// THIS IS SYCNED FROM THE ARTIFACT PROJECT
// TODO publish to standalone repo
import {
  Cradle,
  DispatchFunctions,
  EventSourceMessage,
  getProcType,
  Params,
  PID,
  PierceRequest,
  ProcessOptions,
  Splice,
} from './web-client.types.ts'

type ToError = (object: object) => Error
type ToEvents = (stream: ReadableStream) => AsyncIterable<EventSourceMessage>
export default class WebClient implements Cradle {
  private readonly fetcher: (
    input: URL | RequestInfo,
    init?: RequestInit,
  ) => Promise<Response>
  private readonly toEvents: ToEvents
  private readonly url: string
  private readonly toError: ToError
  constructor(
    url: string,
    toError: ToError,
    toEvents: ToEvents,
    fetcher?: typeof fetch,
  ) {
    if (url.endsWith('/')) {
      throw new Error('url should not end with "/": ' + url)
    }
    this.url = url
    this.toError = toError
    this.toEvents = toEvents
    if (fetcher) {
      this.fetcher = fetcher
    } else {
      this.fetcher = (path, opts) => fetch(`${url}${path}`, opts)
    }
  }
  ping(params = {}) {
    return this.request('ping', params)
  }
  apiSchema(params: { isolate: string }) {
    return this.request('apiSchema', params)
  }
  pierce(params: PierceRequest) {
    return this.request('pierce', params)
  }
  async transcribe(params: { audio: File }) {
    // this is a special one that uses a blob arg
    // if all used formdata, then we don't care the type of the args
    const response = await fetch(`${this.url}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    return await response.json()
  }
  logs(params: { repo: string }) {
    return this.request('logs', params)
  }
  async pierces(isolate: string, target: PID) {
    // cradle side, since functions cannot be returned from isolate calls
    const apiSchema = await this.apiSchema({ isolate })
    const pierces: DispatchFunctions = {}
    for (const functionName of Object.keys(apiSchema)) {
      pierces[functionName] = (
        params: Params = {},
        options?: ProcessOptions,
      ) => {
        const proctype = getProcType(options)
        const pierce: PierceRequest = {
          target,
          ulid: 'calculated-server-side',
          isolate,
          functionName,
          params,
          proctype,
        }
        return this.pierce(pierce)
      }
    }
    return pierces
  }
  probe(params: { repo: string }) {
    return this.request('probe', params)
  }
  init(params: { repo: string }) {
    return this.request('init', params)
  }
  clone(params: { repo: string }) {
    return this.request('clone', params)
  }
  rm(params: { repo: string }) {
    return this.request('rm', params)
  }
  stop() {
  }
  read(params: { pid: PID; path: string }): AsyncIterable<Splice> {
    const iterable = {
      [Symbol.asyncIterator]: () => this.readGenerator(params),
    }
    return iterable
  }
  private async *readGenerator(params: { pid: PID; path: string }) {
    // TODO handle reconnect
    const response = await this.fetcher(`/api/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      throw new Error('response not ok')
    }
    if (!response.body) {
      throw new Error('response body is missing')
    }
    for await (const event of this.toEvents(response.body)) {
      if (event.event === 'splice') {
        const splice: Splice = JSON.parse(event.data)
        yield splice
      } else {
        console.log('event', event)
      }
    }
  }

  private async request(path: string, params: Params) {
    const response = await this.fetcher(`/api/${path}?pretty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error(
        path + ' ' + JSON.stringify(params) + ' ' + response.status + ' ' +
          response.statusText,
      )
    }
    const outcome = await response.json()
    if (outcome.error) {
      throw this.toError(outcome.error)
    }
    return outcome.result
  }
}
