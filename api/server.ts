import { Hono } from 'hono'
// TODO try out the fast router to improve load times
import {
  cors,
  endTime,
  logger,
  poweredBy,
  prettyJSON,
  setMetric,
  startTime,
  timing,
} from 'hono/middleware'
import { streamSSE } from 'hono/helper'
import { Engine } from '../engine.ts'
import { assert, Debug, serializeError } from '@/utils.ts'
import { EventSourceMessage, SerializableError } from '@/constants.ts'
const log = Debug('AI:server')

let sseId = 0
export default class Server {
  #engine: Engine
  #app: Hono
  private constructor(engine: Engine, app: Hono) {
    this.#engine = engine
    this.#app = app
  }
  get engine() {
    return this.#engine
  }

  // if the env flag is set, we know our system chain
  // else, check for it, and make it if not there

  static async create() {
    // TODO whilst no system chain, fail with help message
    const engine = await Engine.create()
    const app = new Hono().basePath('/api')

    app.use(timing())
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())
    app.get('/', async (c) => {
      const result = await engine.initialize()
      return c.json(result)
    })
    app.post(`/ping`, async (c) => {
      const payload = await c.req.json()
      let data
      if (payload.data) {
        data = payload.data
      }
      const result: typeof data = await engine.ping(data)
      return c.json({ result })
    })
    app.post(`/pierce`, async (c) => {
      startTime(c, 'pierce')
      const region = Deno.env.get('DENO_REGION') || '(unknown)'
      setMetric(c, 'region', 'Region: ' + region)
      const deployment = Deno.env.get('DENO_DEPLOYMENT_ID') || '(unknown)'
      setMetric(c, 'deployment', 'Deployment: ' + deployment)

      // TODO hook GitKV for write count, read count, and size

      let params
      const outcome: { error?: SerializableError } = {}
      try {
        params = await c.req.json()
        await engine.pierce(params)
      } catch (error) {
        console.error('params:', params, '\n\nerror:', error)
        outcome.error = serializeError(error)
      }
      endTime(c, 'pierce')
      return c.json(outcome)
    })
    app.post(`/apiSchema`, async (c) => {
      const params = await c.req.json()
      assert(typeof params === 'object', 'params is required')
      const { isolate } = params
      assert(typeof isolate === 'string', 'isolate is required')
      const result = await engine.apiSchema(isolate)
      return c.json({ result })
    })

    app.post('/read', (c) => {
      return streamSSE(c, async (stream) => {
        const params = await c.req.json()
        const abort = new AbortController()
        stream.onAbort(() => {
          abort.abort()
        })
        const { pid, path, after } = params
        try {
          const iterable = engine.read(pid, path, after, abort.signal)
          for await (const splice of iterable) {
            const event: EventSourceMessage = {
              data: JSON.stringify(splice, null, 2),
              event: 'splice',
              id: String(sseId++),
            }
            log('event', event)
            await stream.writeSSE(event)
          }
          log('stream end')
        } catch (error) {
          console.error('server stream error', error)
        }
      }, async (error, stream) => {
        await Promise.resolve()
        console.error('error', error, stream)
      })
    })

    app.post('/transcribe', async (c) => {
      const body = await c.req.parseBody()
      const audio = body['audio'] as File
      assert(audio, 'audio is required')
      const { text } = await engine.transcribe(audio)
      log('transcribe text', text)
      return c.json({ text })
    })

    return new Server(engine, app)
  }
  async stop() {
    // TODO add all the read streams to be stopped too ?
    await this.#engine.stop()
  }
  get request() {
    return this.#app.request
  }
  get fetch() {
    return this.#app.fetch
  }
}

Debug.enable('AI:runner-chat')
