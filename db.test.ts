import { expect, isKvTestMode } from '@utils'
import DB from '@/db.ts'

Deno.test('db', async () => {
  const db = await DB.create(DB.generateAesKey())
  expect(isKvTestMode()).toBe(true)
  db.stop()
})
