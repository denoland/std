// run with deno run --unstable-kv -A ./artifact/_utils/kv-mgmt.ts

import { load } from '$std/dotenv/mod.ts'
const env = await load()
Deno.env.set('DENO_KV_ACCESS_TOKEN', env.DENO_KV_ACCESS_TOKEN)

const db = await Deno.openKv(
  'https://api.deno.com/databases/5edafba6-ecc9-4397-be77-60535eb83795/connect',
)

const all = db.list({ prefix: [] })

for await (const { key, value } of all) {
  console.log(key, value)
  await db.delete(key)
}
