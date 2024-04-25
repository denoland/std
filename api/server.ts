import { Context, Hono } from 'hono'
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
import { EventSourceMessage } from '@/constants.ts'
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
  static async create() {
    // TODO whilst no system chain, fail with help message
    const engine = await Engine.create()
    const app = new Hono().basePath('/api')

    app.use(timing())
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())
    app.get('/', (c) => {
      return execute(c, engine.bootSuperUser(), 'bootSuperUser')
    })
    app.post(`/ping`, async (c) => {
      const params = await c.req.json()
      return execute(c, engine.ping(params), 'ping')
    })
    app.post(`/pierce`, async (c) => {
      // TODO hook GitKV for write count, read count, and size
      const params = await c.req.json()
      return execute(c, engine.pierce(params), 'pierce')
    })
    app.post(`/apiSchema`, async (c) => {
      const params = await c.req.json()
      return execute(c, engine.apiSchema(params.isolate), 'apiSchema')
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
    app.post(`/readJSON`, async (c) => {
      const params = await c.req.json()
      const { path, pid } = params
      return execute(c, engine.readJSON(path, pid), 'exists')
    })
    app.post(`/exists`, async (c) => {
      const params = await c.req.json()
      const { path, pid } = params
      return execute(c, engine.exists(path, pid), 'exists')
    })
    app.post('/transcribe', async (c) => {
      const body = await c.req.parseBody()
      const audio = body['audio'] as File
      assert(audio, 'audio is required')
      return execute(c, engine.transcribe(audio), 'transcribe')
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

const execute = async (c: Context, p: Promise<unknown>, name: string) => {
  startTime(c, name)
  const region = Deno.env.get('DENO_REGION') || '(unknown)'
  setMetric(c, 'region', 'Region: ' + region)
  const deployment = Deno.env.get('DENO_DEPLOYMENT_ID') || '(unknown)'
  setMetric(c, 'deployment', 'Deployment: ' + deployment)

  try {
    const result = await p
    endTime(c, name)
    return c.json({ result })
  } catch (error) {
    endTime(c, name)
    return c.json({ error: serializeError(error) })
  }
}

Debug.enable('AI:completions AI:q*')
