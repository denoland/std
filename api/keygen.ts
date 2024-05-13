import * as secp from '@noble/secp256k1'
import { generateKey } from '@kitsonk/kv-toolbox/crypto'
import { assert } from '@std/assert'

const privKey = secp.utils.randomPrivateKey()

const key = secp.etc.bytesToHex(privKey)
assert(secp.utils.isValidPrivateKey(key), 'invalid private key')

console.log('private key')
console.log(key)
console.log('')
console.log('encryption key')
console.log(generateKey())
