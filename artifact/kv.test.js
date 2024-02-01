import store from './kv.js'
import delay from 'npm:delay'

Deno.test('kv', async () => {
  const kv = await store.create()
  for (let i = 0; i < 10; i++) {
    await kv.dispatch('test-' + i)
  }
  await kv.stop()
})
