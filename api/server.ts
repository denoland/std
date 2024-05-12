import { createGitHubOAuthConfig, createHelpers } from '@deno/kv-oauth'
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
import { EventSourceMessage, machineIdRegex } from '@/constants.ts'
import '@std/dotenv/load'

const log = Debug('AI:server')

// need to make a stable machine so that admin actions can enter the system on
// the server.

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
    const engine = await Engine.start()
    const base = new Hono()
    const app = base.basePath('/api')

    app.use(timing())
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())
    app.post(`/ping`, async (c) => {
      const params = await c.req.json()
      return execute(c, engine.ping(params), 'ping')
    })
    app.post(`/homeAddress`, (c) => {
      return execute(c, Promise.resolve(engine.homeAddress), 'homeAddress')
    })
    app.post(`/createMachineSession`, async (c) => {
      const params = await c.req.json()
      const p = engine.createMachineSession(params.pid)
      return execute(c, p, 'createMachineSession')
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

    if (Deno.env.get('GITHUB_CLIENT_ID')) {
      const {
        signIn,
        handleCallback,
        signOut,
      } = createHelpers(createGitHubOAuthConfig())
      const auth = base.basePath('/auth')
      auth.get('/signin', async (c) => {
        const { machineId } = c.req.query()
        if (!machineIdRegex.test(machineId)) {
          // TODO check key is valid using signatures
          throw new Error('machineId querystring is required')
        }

        const response = await signIn(c.req.raw)
        const cookie = response.headers.get('set-cookie')
        console.log('cookie', cookie)
        // acting as the github actor, pierce the github chain to store this info

        return response
        // c.header('set-cookie', response.headers.get('set-cookie')!)
        // return c.redirect(response.headers.get('location')!, response.status)
      })

      auth.get('/callback', async (c) => {
        const { response, tokens, sessionId } = await handleCallback(c.req.raw)
        console.log('tokens', tokens, sessionId) // lol
        // acting as the github actor, pierce the github chain to store this info
        // as well as storing the token from github
        // there should be one PAT per machine id

        // get the userId from github
        // move the machine branch to be inside the user branch
        // send the new pid down to the browser

        // make a fetch request to get the userId from github

        // pass back an id so the browser knows which pats it has

        return response
        // c.header('set-cookie', response.headers.get('set-cookie')!)
        // return c.redirect(response.headers.get('location')!, response.status)
      })

      auth.get('/signout', async (c) => {
        const response = await signOut(c.req.raw)
        return response
        // c.header('set-cookie', response.headers.get('set-cookie')!)
        // return c.redirect(response.headers.get('location')!, response.status)
      })
    }

    // TODO set a cookie for the machineId so it doesn't have to prove again
    // or get a sig on all pierce actions, and only allow correctly signed ones
    // to enter

    return new Server(engine, base)
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

// Debug.enable('AI:completions AI:q*')
