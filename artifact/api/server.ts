import { Hono } from 'https://deno.land/x/hono/mod.ts'
import {
  cors,
  logger,
  poweredBy,
  prettyJSON,
} from 'https://deno.land/x/hono/middleware.ts'
import QueueCradle from '@/artifact/cradle.ts'
import { asOutcome, assert } from '@/artifact/utils.ts'
import { Cradle } from '@/artifact/constants.ts'
import { ulid } from '$std/ulid/mod.ts'

export default class Server {
  #artifact!: QueueCradle
  #app!: Hono
  static async create() {
    const artifact = await QueueCradle.create()

    const app = new Hono().basePath('/api')
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())

    type serverMethods = (keyof Cradle)[]
    const functions: serverMethods = [
      'ping',
      'apiSchema',
      'pierce',
      'transcribe',
      'logs',
      'init',
      'clone',
    ]
    for (const functionName of functions) {
      assert(functionName !== 'pierces', 'pierces is not server side')
      app.post(
        `/${functionName}`,
        async (c) => {
          const params = await c.req.json()
          if (functionName === 'pierce') {
            const msg = `ulid incorrect: ${params.ulid}`
            assert(params.ulid === 'calculated-server-side', msg)
            params.ulid = ulid()
          }
          const outcome = await asOutcome(artifact[functionName](params))
          return c.json(outcome)
        },
      )
    }
    const server = new Server()
    server.#artifact = artifact
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
