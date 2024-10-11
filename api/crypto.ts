import * as secp from '@noble/secp256k1'
import { ripemd160 } from '@noble/hashes/ripemd160'
import { base32 } from 'multiformats/bases/base32'
import { machineIdRegex } from './types.ts'

export class Crypto {
  readonly #privKey: Uint8Array
  readonly #pubKey: Uint8Array
  readonly #machineId: string

  static load(privateKey: string) {
    if (!secp.utils.isValidPrivateKey(privateKey)) {
      throw new Error('Invalid private key')
    }
    return new Crypto(privateKey)
  }
  static generatePrivateKey() {
    return secp.etc.bytesToHex(secp.utils.randomPrivateKey())
  }
  static assert(machineId: string) {
    if (!machineIdRegex.test(machineId)) {
      throw new Error('Invalid machine id: ' + machineId)
    }
    return true
  }
  private constructor(privateKey: string) {
    this.#privKey = secp.etc.hexToBytes(privateKey)
    this.#pubKey = secp.getPublicKey(this.#privKey)
    const hash = ripemd160(this.#pubKey)
    this.#machineId = 'mac_' + base32.encode(hash)
    if (!machineIdRegex.test(this.#machineId)) {
      throw new Error('Invalid machine id: ' + this.#machineId)
    }
  }
  get machineId() {
    return this.#machineId
  }
}
