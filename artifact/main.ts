// TODO on first boot, run some diagnostic tests and benchmarks
// should be able to commit these benchmarks back to gh to publish them

const kv = await Deno.openKv()
kv.listenQueue((msg) => {
  console.log('queue', msg)
})
