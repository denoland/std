import { EventSourceParserStream } from 'eventsource-parser/stream'
import { deserializeError } from 'serialize-error'
import {
  EngineInterface,
  JSONSchemaType,
  JsonValue,
  Params,
  PID,
  PierceRequest,
  Splice,
} from './web-client.types.ts'

export class WebClientEngine implements EngineInterface {
  readonly #aborts = new Set<AbortController>()
  readonly #readPromises = new Set<Promise<void>>()
  readonly #fetcher: (
    input: URL | RequestInfo,
    init?: RequestInit,
  ) => Promise<Response>
  readonly #schemas = new Map<string, JSONSchemaType<object>>()

  private constructor(url: string, fetcher?: typeof fetch) {
    if (url.endsWith('/')) {
      throw new Error('url should not end with "/": ' + url)
    }
    if (fetcher) {
      this.#fetcher = fetcher
    } else {
      this.#fetcher = (path, opts) => fetch(`${url}${path}`, opts)
    }
  }
  static create(url: string, fetcher?: typeof fetch) {
    return new WebClientEngine(url, fetcher)
  }
  async stop() {
    for (const abort of this.#aborts) {
      abort.abort()
    }
    await Promise.all([...this.#readPromises])
  }
  async ping(data?: JsonValue) {
    const payload: { data?: JsonValue } = { data }
    return await this.#request('ping', payload)
  }
  async pierce(pierce: PierceRequest) {
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

    const response = await this.#fetcher(`/api/transcribe`, {
      method: 'POST',
      body: formData,
    })

    return await response.json()
  }

  // #region: Splice Reading
  read(pid: PID, path?: string, signal?: AbortSignal) {
    const abort = new AbortController()
    if (signal) {
      signal.addEventListener('abort', () => {
        abort.abort()
      })
    }
    const finished = this.#waiter(abort)

    return new ReadableStream<Splice>({
      start: async (controller) => {
        let repeat = 0
        while (!abort.signal.aborted) {
          // TODO cache last response to skip if receive duplicate on resume
          if (repeat++ > 0) {
            await new Promise((r) => setTimeout(r, 500))
            console.log('repeat', repeat)
          }
          try {
            const response = await this.#fetcher(`/api/read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pid, path }),
              signal: abort.signal,
              keepalive: true,
            })
            if (!response.ok) {
              throw new Error('response not ok')
            }
            if (!response.body) {
              throw new Error('response body is missing')
            }
            const splices = toEvents(response.body)
            const reader = splices.getReader()
            abort.signal.addEventListener('abort', () => {
              reader.cancel()
            })
            while (!abort.signal.aborted) {
              try {
                const { done, value } = await reader.read()
                if (done || abort.signal.aborted) {
                  break
                }
                if (value.event === 'splice') {
                  const splice: Splice = JSON.parse(value.data)
                  controller.enqueue(splice)
                } else {
                  console.error('unexpected event', value.event, value)
                }
              } catch (error) {
                console.error('inner stream error:', error)
                break
              }
            }
          } catch (error) {
            console.log('stream error:', error)
          }
        }
        finished()
      },
    })
  }
  #waiter(abort: AbortController) {
    let resolve: () => void
    const readPromise = new Promise<void>((_resolve) => {
      resolve = _resolve
    })
    this.#readPromises.add(readPromise)
    this.#aborts.add(abort)
    return () => {
      resolve()
      this.#readPromises.delete(readPromise)
      this.#aborts.delete(abort)
    }
  }
  async #request(path: string, params: Params) {
    const response = await this.#fetcher(`/api/${path}?pretty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
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
}
const toEvents = (stream: ReadableStream) =>
  stream.pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
