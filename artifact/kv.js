export default class kv {
  #kv
  static async create() {
    const _kv = new kv()
    _kv.#kv = await Deno.openKv()
    _kv.#listen()
    return _kv
  }
  #listen() {
    this.#kv.listenQueue((msg) => {
    })
  }
  async dispatch(msg) {
    const result = await this.#kv.enqueue(msg)
    return result
  }
  async stop() {
    await this.#kv.close()
  }
}
