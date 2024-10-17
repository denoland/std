import { ripemd160 } from '@noble/hashes/ripemd160'
import { base32crockford } from '@scure/base'
import { ulid as _ulid } from 'ulid'

let deterministicMode = false
let count = 0
export const _enableDeterministicMockMode = () => {
  if (deterministicMode) {
    console.error('Deterministic mode already enabled')
    throw new Error('Deterministic mode already enabled')
  }
  deterministicMode = true
}
export const _disableDeterministicMockMode = () => {
  if (!deterministicMode) {
    console.error('Deterministic mode already disabled')
    throw new Error('Deterministic mode already disabled')
  }
  deterministicMode = false
  count = 0
}
export const peekRandomnessCount = () => {
  return count
}

const getSeed = () => {
  if (deterministicMode) {
    return '' + count++
  }
  return _ulid()
}

export const randomness = () => {
  return fixedRandomness(getSeed())
}

export const fixedRandomness = (seed: string) => {
  const hash = ripemd160(seed)
  const encoded = base32crockford.encode(hash)
  const result = encoded.slice(-16)

  return result
}
