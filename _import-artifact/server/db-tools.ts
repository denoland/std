import { load } from '@std/dotenv'
import { DB_LOCK, HOME_ADDRESS, UNDELIVERED } from '@/keys.ts'
import { PID, print } from '@/constants.ts'
await load({ export: true })

console.log('CLOUD_URL:', Deno.env.get('CLOUD_URL'))
console.log('db', Deno.env.get('DENO_KV_URL'))

const db = await Deno.openKv(Deno.env.get('DENO_KV_URL'))
const undelivered = db.list({ prefix: UNDELIVERED })

const homeAddress = await db.get<PID>(HOME_ADDRESS)
console.log('homeAddress', homeAddress.value)
if (homeAddress.value) {
  console.log('homeAddress', print(homeAddress.value))
}

const dbLock = await db.get<string>(DB_LOCK)
console.log('dbLock', dbLock.value)

// console.log('deleting dblock')
// await db.delete(DB_LOCK)

for await (const { key, value } of undelivered) {
  console.log('undelivered: ', key, value)
}

const start = Date.now()
await db.get(['void key'])
console.log('latency', Date.now() - start)

// const all = db.list({ prefix: [] })

// for await (const { key } of all) {
//   console.log('key: ', key)
// }
