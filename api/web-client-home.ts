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
  #sessionActions: Promise<Api>
  private constructor(engine: EngineInterface, pid: PID) {
    this.#engine = engine
    this.#pid = pid
    this.#base = Session.createHome(engine, pid, this)
    this.#sessionActions = this.#base.actions<Api>('session', this.#pid)
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
  /** If the given pid is valid, uses that session, else creates a new one */
  async createSession(retry?: PID) {
    // TODO add some keys to sign with
    const sessionActions = await this.#sessionActions
    const pid = await sessionActions.create({ retry })
    return Session.create(this.#engine, pid, this)
  }
  ping(params?: { data?: JsonValue }) {
    return this.#engine.ping(params?.data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
}

type Api = {
  create: (params?: { retry?: PID }) => Promise<PID>
  close: () => void
}
