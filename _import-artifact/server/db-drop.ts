import { load } from '@std/dotenv'
await load({ export: true })

const url = Deno.env.get('DENO_KV_URL')
const db = await Deno.openKv(url)

if (!confirm(`WARNING: The database ${url} will be reset. Continue?`)) {
  Deno.exit()
}

const all = db.list({ prefix: [] }, { batchSize: 1000 })

const promises = []
for await (const { key } of all) {
  console.log('deleting: ', key)
  promises.push(db.delete(key))
}
await Promise.all(promises)
