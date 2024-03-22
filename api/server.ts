import { Hono } from 'https://deno.land/x/hono/mod.ts'

import {
  cors,
  logger,
  poweredBy,
  prettyJSON,
} from 'https://deno.land/x/hono/middleware.ts'
import { streamSSE } from 'https://deno.land/x/hono/helper.ts'
import QueueCradle from '@/cradle.ts'
import { asOutcome, assert, Debug } from '@/utils.ts'
import { Cradle, EventSourceMessage } from '@/constants.ts'
import { ulid } from '$std/ulid/mod.ts'
const log = Debug('AI:server')

export default class Server {
  #artifact!: QueueCradle
  #app!: Hono
  #sseId = 0
  static async create() {
    const artifact = await QueueCradle.create()

    const server = new Server()
    server.#artifact = artifact

    const app = new Hono().basePath('/api')
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())

    type serverMethods = (keyof Cradle)[]
    const functions: serverMethods = [
      'ping',
      'apiSchema',
      'pierce',
      'logs',
      'probe',
      'init',
      'clone',
      'rm',
    ]
    for (const functionName of functions) {
      assert(functionName !== 'pierces', 'pierces is not server side')
      app.post(
        `/${functionName}`,
        async (c) => {
          let outcome
          try {
            const params = await c.req.json()
            if (functionName === 'pierce') {
              const msg = `ulid incorrect: ${params.ulid}`
              assert(params.ulid === 'calculated-server-side', msg)
              params.ulid = ulid()
            }
            assert(functionName !== 'read')
            outcome = await asOutcome(artifact[functionName](params))
          } catch (error) {
            outcome = await asOutcome(Promise.reject(error))
          }
          return c.json(outcome)
        },
      )
    }

    app.post('/read', (c) => {
      return streamSSE(c, async (stream) => {
        const params = await c.req.json()
        for await (const splice of artifact.read(params)) {
          const event: EventSourceMessage = {
            data: JSON.stringify(splice, null, 2),
            event: 'splice',
            id: String(server.#sseId++),
          }
          log('event', event)
          await stream.writeSSE(event)
        }
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
