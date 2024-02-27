import { Hono } from 'https://deno.land/x/hono/mod.ts'
import {
  cors,
  logger,
  poweredBy,
  prettyJSON,
} from 'https://deno.land/x/hono/middleware.ts'
import Cradle from '@/artifact/cradle.ts'
import { asOutcome } from '@/artifact/utils.ts'

export default class Server {
  #artifact!: Cradle
  #app!: Hono
  static async create() {
    const artifact = await Cradle.create()

    const app = new Hono().basePath('/api')
    app.use(prettyJSON())
    app.use('*', logger(), poweredBy(), cors())
    app.post(
      '/ping',
      async (c) => {
        const params = await c.req.json()
        // send down an outcome
        const outcome = await asOutcome(artifact.ping(params))
        return c.json(outcome)
      },
    )
    const server = new Server()
    server.#artifact = artifact
    server.#app = app
    return server
  }
  async stop() {
    await this.#artifact.stop()
  }
  request(...args: Parameters<Hono['request']>) {
    return this.#app.request(...args)
  }
  get fetch() {
    return this.#app.fetch
  }
}
