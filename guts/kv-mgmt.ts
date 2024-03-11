import { load } from '$std/dotenv/mod.ts'
const env = await load()
Deno.env.set('DENO_KV_ACCESS_TOKEN', env.DENO_KV_ACCESS_TOKEN)

const db = await Deno.openKv(
  'https://api.deno.com/databases/5edafba6-ecc9-4397-be77-60535eb83795/connect',
)

if (!confirm('WARNING: The database will be reset. Continue?')) {
  Deno.exit()
}

const all = db.list({ prefix: [] })

const promises = []
for await (const { key } of all) {
  console.log('deleted: ', key)
  promises.push(db.delete(key))
}
await Promise.all(promises)
