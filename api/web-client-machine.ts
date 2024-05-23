import * as secp from '@noble/secp256k1'
import {
  ArtifactMachine,
  EngineInterface,
  JsonValue,
  PID,
} from './web-client.types.ts'
import { Terminal } from './web-client-session.ts'

/**
 * Create a shell that is targeted at the home chain, to avoid reimplementation
 * of the shell logic.
 * Ping should validate that the home chain exists on the server.
 */

export class Machine implements ArtifactMachine {
  readonly #engine: EngineInterface
  readonly #pid: PID
  readonly #privKey: Uint8Array
  readonly #pubKey: Uint8Array
  readonly #machineId: string
  #rootSessionPromise: Promise<Terminal>

  static load(engine: EngineInterface, privateKey: string) {
    if (!secp.utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key')
    }
    return new Machine(engine, privateKey)
  }
  static generatePrivateKey() {
    return secp.etc.bytesToHex(secp.utils.randomPrivateKey())
  }
  static deriveMachineId(privateKey: string) {
    if (!secp.utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key')
    }
    const pubKey = secp.getPublicKey(privateKey)
    return secp.etc.bytesToHex(pubKey)
  }

  private constructor(engine: EngineInterface, privateKey: string) {
    this.#engine = engine
    this.#privKey = secp.etc.hexToBytes(privateKey)
    this.#pubKey = secp.getPublicKey(this.#privKey)
    this.#machineId = secp.etc.bytesToHex(this.#pubKey)

    const actorId = this.#machineId
    const machineId = this.#machineId
    const branches = [...engine.homeAddress.branches, actorId, machineId]
    this.#pid = { ...engine.homeAddress, branches }
    this.#rootSessionPromise = this.#connect()
  }
  get rootTerminalPromise() {
    return this.#rootSessionPromise
  }
  get pid() {
    return this.#pid
  }
  get machineId() {
    return this.#machineId
  }
  clone() {
    return new Machine(this.#engine, secp.etc.bytesToHex(this.#privKey))
  }
  async #connect() {
    await this.#engine.ensureMachineTerminal(this.pid)
    return Terminal.openRoot(this.#engine, this)
  }

  /** If the given pid is valid, uses that session, else creates a new one */
  openTerminal(retry?: PID): Terminal {
    if (retry) {
      return Terminal.resume(this.#engine, this, retry)
    }
    return Terminal.create(this.#engine, this)
  }
  ping(params?: { data?: JsonValue }) {
    return this.#engine.ping(params?.data)
    // TODO return some info about the deployment
    // version, deployment location, etc
    // if you want to ping in a chain, use an isolate
  }
}
