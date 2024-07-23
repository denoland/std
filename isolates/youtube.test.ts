import Compartment from '@/io/compartment.ts'
import * as youtube from './youtube.ts'
import { expect } from '@utils'

Deno.test('youtube', async () => {
  await Compartment.create('youtube')
  const videoID = 'zIB7YsC34Tc'
  const lang = 'en'
  const result = await youtube.functions.fetch({ videoID, lang })
  expect(result.details).toBeDefined()
  expect(result.subs).toBeDefined()
})
