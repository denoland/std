import { load } from '$std/dotenv/mod.ts'
import { KEYSPACES } from '@/keys.ts'
await load({ export: true })

const db = await Deno.openKv(Deno.env.get('DENO_KV_URL'))

const undelivered = db.list({ prefix: [KEYSPACES.UNDELIVERED] })

for await (const { key, value } of undelivered) {
  console.log('undelivered: ', key, value)
}

const all = db.list({ prefix: [] })

for await (const { key } of all) {
  console.log('key: ', key)
}
