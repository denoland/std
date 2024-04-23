import {
  ArtifactHome,
  EngineInterface,
  JsonValue,
  PID,
} from './web-client.types.ts'
import { Session } from './web-client-session.ts'

/**
 * Create a shell that is targeted at the home chain, to avoid reimplementation
 * of the shell logic.
 * Ping should validate that the home chain exists on the server.
 */

export class Home implements ArtifactHome {
  readonly #engine: EngineInterface
  readonly #pid: PID
  readonly #base: Session
  private constructor(engine: EngineInterface, pid: PID) {
    this.#engine = engine
    this.#pid = pid
    console.log('home chain', pid)
    this.#base = Session.createHome(engine, pid)
  }
  static create(engine: EngineInterface, pid: PID) {
    if (pid.branches.length > 1) {
      throw new Error('Home chain must be a base chain')
    }
    return new Home(engine, pid)
  }
  get pid() {
    return this.#pid
  }
  stop() {
    return this.#base.stop()
  }
  async createSession() {
    const actions = await this.#base.actions<Api>('session', this.#pid)
    // TODO add some keys to sign with
    const pid = await actions.create()
    return Session.create(this.#engine, pid)
  }
  ping(params?: { data?: JsonValue }) {
    return this.#engine.ping(params?.data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
}

type Api = {
  create: () => Promise<PID>
  close: () => void
}
