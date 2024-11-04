import { createGitHubOAuthConfig, createHelpers } from '@deno/kv-oauth'
import { type Context, Hono } from 'hono'
// TODO try out the fast router to improve load times
import { cors } from 'hono/cors'
import { endTime, setMetric, startTime, timing } from 'hono/timing'
import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { SSEStreamingApi, streamSSE } from 'hono/streaming'
import { Engine } from '../engine/engine.ts'
import { assert, Debug, delay, serializeError } from '@/utils.ts'
import { EventSourceMessage, machineIdRegex, Provisioner } from '@/constants.ts'
import '@std/dotenv/load'
type Seed = Deno.KvEntry<unknown>[]

const log = Debug('AI:server')

let sseId = 0
export default class Server {
  #engine: Engine
  #app: Hono
  #provisioning: Promise<void> | undefined
  private constructor(engine: Engine, app: Hono) {
    this.#engine = engine
    this.#app = app
  }
  static create(engine: Engine, init?: Provisioner) {
    const base = new Hono()
    const server = new Server(engine, base)

    base.use(timing())
    base.use(prettyJSON())
    base.use('*', logger(), poweredBy(), cors())

    base.use(async (_, next) => {
      if (!server.#provisioning) {
        // must be as part of a request, else deno deploy times out
        server.#provisioning = engine.ensureHomeAddress(init)
      }
      await server.#provisioning
      await next()
    })

    const app = base.basePath('/api')
    app.post(`/ping`, async (c) => {
      const params = await c.req.json()
      return execute(c, engine.ping(params), 'ping')
    })
    app.post(`/homeAddress`, (c) => {
      return execute(c, Promise.resolve(engine.homeAddress), 'homeAddress')
    })
    app.post(`/upsertBackchat`, async (c) => {
      const { machineId, resume } = await c.req.json() as {
        machineId: string
        resume?: string
      }
      return execute(
        c,
        engine.upsertBackchat(machineId, resume),
        'upsertBackchat',
      )
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
    app.post('/watch', (c) => {
      return streamSSE(c, async (stream) => {
        const params = await c.req.json()
        const abort = new AbortController()
        stream.onAbort(() => abort.abort('stream aborted'))
        engine.abortSignal.addEventListener('abort', () => abort.abort())
        const { pid, path, after } = params
        keepalive(stream, abort.signal)
        try {
          const iterable = engine.watch(pid, path, after, abort.signal)
          for await (const splice of iterable) {
            const event: EventSourceMessage = {
              data: JSON.stringify(splice, null, 2),
              event: 'splice',
              id: String(sseId++),
            }
            await stream.writeSSE(event)
          }
          log('stream end')
        } catch (error) {
          console.error('server stream error', error)
          // if an error occurred, stall the stream to slow the clients
          if (abort.signal.aborted) {
            return
          }
          log('stalling stream indefinitely')
          await delay(3600000, abort)
        }
      })
    })
    app.post(`/read`, async (c) => {
      const params = await c.req.json()
      const { path, pid, commit } = params
      return execute(c, engine.read(path, pid, commit), 'read')
    })
    app.post(`/readTree`, async (c) => {
      const params = await c.req.json()
      const { path, pid, commit } = params
      return execute(c, engine.readTree(path, pid, commit), 'readTree')
    })
    app.post(`/readJSON`, async (c) => {
      const params = await c.req.json()
      const { path, pid, commit } = params
      return execute(c, engine.readJSON(path, pid, commit), 'readJSON')
    })
    app.post(`/readBinary`, async (c) => {
      const params = await c.req.json()
      const { path, pid, commit } = params
      return execute(c, engine.readBinary(path, pid, commit), 'readBinary')
    })
    app.post(`/splice`, async (c) => {
      // TODO add a zod schema for format
      const { target, opts } = await c.req.json()
      return execute(c, engine.splice(target, opts), 'splice')
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

    const hooks = base.basePath('/hooks')
    hooks.post('/github', async (c) => {
      const body = await c.req.json()
      console.log('github hook', body)
      if (body?.repository?.full_name !== 'dreamcatcher-tech/HAL') {
        return c.json({ error: 'invalid repository' }, 400)
      }
      const su = engine.superUser()
      const target = { ...su.pid, branches: ['main'] }
      const promise = su.pull({ repo: 'dreamcatcher-tech/HAL', target })
        .then(() => console.log('done pull'))
        .catch((error) => console.error('pull error', error))
      console.log('starting pull')

      return execute(c, promise, 'hooks/github')
    })

    if (Deno.env.get('GITHUB_CLIENT_ID')) {
      // TODO use https://www.npmjs.com/package/@hono/oauth-providers
      // used to get repo access, whereas privy is used for sign in
    }

    return server
  }
  dump() {
    return this.#engine.dump()
  }
  async stop() {
    // TODO figure out why this stops resource leaks
    await this.#provisioning
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
  const denoVersion = navigator.userAgent.toLowerCase()
  setMetric(c, 'deno', 'Deno Version: ' + denoVersion)
  const region = Deno.env.get('DENO_REGION') || '(unknown)'
  setMetric(c, 'region', 'Region: ' + region)
  const deployment = Deno.env.get('DENO_DEPLOYMENT_ID') || '(unknown)'
  setMetric(c, 'deployment', 'Deployment: ' + deployment)

  log('execute', name, c.req.url)

  try {
    const result = await p
    endTime(c, name)
    if (result instanceof Uint8Array) {
      return c.body(result)
      // TODO handle an error in readBinary
    }
    return c.json({ result })
  } catch (error) {
    endTime(c, name)
    return c.json({ error: serializeError(error) })
  }
}
const keepalive = async (stream: SSEStreamingApi, signal: AbortSignal) => {
  while (!signal.aborted) {
    try {
      // persistent attempts to stop the event loop from exiting while waiting
      await delay(30000, { signal, persistent: true })
    } catch (_) {
      return
    }
    if (!signal.aborted) {
      const event: EventSourceMessage = {
        data: '',
        event: 'keepalive',
        id: String(sseId++),
      }
      await stream.writeSSE(event)
    }
  }
}

// TODO move this to be a universal napp server, where it bridges between
// actions

// so there would be no special functions or routes, and everything would be a
// json function.

// if special oauth callback rountes are needed, these should be able to be
// generic.

// may need middleare type patterns in json functions, so we can pipeline things
// without causing an action to be overly complex.
// so we could check for auth as a seperate function to whatever the main
// function was.
