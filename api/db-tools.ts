import { load } from '$std/dotenv/mod.ts'
import { KEYSPACES } from '@/keys.ts'
await load({ export: true })

const db = await Deno.openKv(Deno.env.get('DENO_KV_URL'))

const all = db.list({ prefix: [KEYSPACES.HEADLOCK] })

for await (const { key } of all) {
  console.log('lock: ', key)
}
