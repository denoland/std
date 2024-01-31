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
      if (Number.isInteger(msg)) {
        if (msg % 1000 === 0) {
          console.log('messages processed:', msg)
        }
      } else {
        console.log(msg)
      }
    })
  }
  async dispatch(msg) {
    const result = await this.#kv.enqueue(msg)
  }
  async stop() {
    await this.#kv.close()
  }
}
