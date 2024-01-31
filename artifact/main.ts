import store from './kv.js'

Deno.serve(async (_req) => {
  //   return await test()
  return new Response('ok')
})

export const test = async () => {
  const kv = await store.create()
  console.log('request')
  const promises = []
  const count = 2000
  for (let i = 0; i < count; i++) {
    promises.push(kv.dispatch(i))
  }
  await Promise.all(promises)
  console.log('done', count)
  return new Response('ok')
}
