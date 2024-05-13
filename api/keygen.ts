import * as secp from '@noble/secp256k1'
import { assert } from '@std/assert'
import { generateKey } from '@kitsonk/kv-toolbox/crypto'

console.log('private key')
console.time('private key')
const privKey = secp.utils.randomPrivateKey()
const privateKey = secp.etc.bytesToHex(privKey)
console.log(privateKey)
console.timeEnd('private key')
console.time('private key check ok')
assert(secp.utils.isValidPrivateKey(privateKey), 'invalid private key')
console.timeEnd('private key check ok')
console.log('')

console.time('public key')
const publicKey = secp.etc.bytesToHex(secp.getPublicKey(privateKey))
console.log('public key')
console.log(publicKey)
console.timeEnd('public key')
console.log('')

console.log('AES encryption key')
console.time('AES encryption key')
console.log(generateKey())
console.timeEnd('AES encryption key')
