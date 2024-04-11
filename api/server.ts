import { Hono } from 'https://deno.land/x/hono/mod.ts'
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
} from 'https://deno.land/x/hono/middleware.ts'
import { streamSSE } from 'https://deno.land/x/hono/helper.ts'
import { Engine } from '../engine.ts'
import { assert, Debug, serializeError } from '@/utils.ts'
import { Artifact, EventSourceMessage, SerializableError } from '@/constants.ts'
const log = Debug('AI:server')

export default class Server {
  #artifact!: Cradle
  #app!: Hono
  #sseId = 0
  static async create() {
    // TODO whilst no system chain, fail with help message
    const artifact = await Cradle.create()

    const server = new Server()
    server.#artifact = artifact

    const app = new Hono().basePath('/api')
    app.use(timing())
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())
    type serverMethods = (keyof Artifact)[]
    const functions: serverMethods = [
      'ping',
      'apiSchema',
      'logs',
      'probe',
      'init',
      'clone',
      'rm',
    ]
    for (const functionName of functions) {
      app.post(
        `/${functionName}`,
        async (c) => {
          startTime(c, 'function', 'Function: ' + functionName)
          const region = Deno.env.get('DENO_REGION') || '(unknown)'
          setMetric(c, 'region', 'Region: ' + region)
          const deployment = Deno.env.get('DENO_DEPLOYMENT_ID') || '(unknown)'
          setMetric(c, 'deployment', 'Deployment: ' + deployment)

          // TODO hook GitKV for write count, read count, and size

          const outcome: { result?: unknown; error?: SerializableError } = {}
          let params
          try {
            params = await c.req.json()
            // but how to pipe everything down the queue lane ?
            const result = await artifact[functionName](params)
            if (result !== undefined) {
              outcome.result = result
            }
          } catch (error) {
            console.error(
              'functionName:',
              functionName,
              '\n\nparams:',
              params,
              '\n\nerror:',
              error,
            )
            outcome.error = serializeError(error)
          }
          endTime(c, 'function')
          return c.json(outcome)
        },
      )
    }

    app.post('/read', (c) => {
      return streamSSE(c, async (stream) => {
        const params = await c.req.json()
        const abort = new AbortController()
        stream.onAbort(() => {
          abort.abort()
        })

        const { pid, path } = params
        try {
          for await (const splice of artifact.read(pid, path, abort.signal)) {
            const event: EventSourceMessage = {
              data: JSON.stringify(splice, null, 2),
              event: 'splice',
              id: String(server.#sseId++),
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
      const { text } = await artifact.transcribe({ audio })
      log('transcribe text', text)
      return c.json({ text })
    })

    server.#app = app
    return server
  }
  async stop() {
    // TODO add all the read streams to be stopped too ?
    await this.#artifact.stop()
  }
  get request() {
    return this.#app.request
  }
  get fetch() {
    return this.#app.fetch
  }
}

Debug.enable('AI:runner-chat')
