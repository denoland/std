import store from './kv.js'

const kv = await store.create()

Deno.serve(async (_req) => {
  console.log('request')
  const promises = []
  const count = 2000
  for (let i = 0; i < 2000; i++) {
    promises.push(kv.dispatch(i))
  }
  await Promise.all(promises)
  console.log('done', count)
  return new Response('ok')
})
