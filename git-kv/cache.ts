import { assert } from '@std/assert'

type KvKey = (string | number)[]

export class Cache {
  static create() {
    return new Cache()
  }

  static #local = new Map<string, Uint8Array>()
  #big: globalThis.Cache | undefined

  async #load() {
    if ('caches' in globalThis && !this.#big) {
      // TODO: If needed, name caches per repo
      this.#big = await caches.open('hashbucket')
    }
  }

  async has(key: KvKey): Promise<boolean> {
    const url = toUrl(key)
    if (Cache.#local.has(url)) {
      return true
    }

    await this.#load()
    if (this.#big) {
      const cached = await this.#big.match(url)
      if (cached) {
        const cloned = cached.clone()
        const bytes = await cloned.arrayBuffer()
        const data = new Uint8Array(bytes)
        Cache.#local.set(url, data)
        return true
      }
    }
    return false
  }

  get(key: KvKey): Uint8Array {
    const url = toUrl(key)
    if (Cache.#local.has(url)) {
      const result = Cache.#local.get(url)
      assert(result, 'cache inconsistency')
      return result
    }
    throw new Error('not found in cache: ' + key.join('/'))
  }

  async set(key: KvKey, value: Uint8Array): Promise<void> {
    await this.#load()
    const url = toUrl(key)
    Cache.#local.set(url, value)
    if (this.#big) {
      const request = new Request(url)
      // We create a new Response with the data
      const response = new Response(value)
      await this.#big.put(request, response)
    }
  }
}

function toUrl(pathKey: KvKey): string {
  return 'http://' + pathKey.join('/')
}
