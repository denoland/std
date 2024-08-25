import Compartment from '@/io/compartment.ts'
import { Api, VideoDetails } from './youtube.ts'
import { assert, expect } from '@utils'
import { createMockApi } from '@/tests/fixtures/mock-api.ts'
Deno.test('youtube', async () => {
  const compartment = await Compartment.create('youtube')
  const { api, stop } = await createMockApi('test/youtube')
  const { fetch } = compartment.functions<Api>(api)

  const videoID = 'zIB7YsC34Tc'
  const lang = 'en'

  const path = 'test/youtube/fetch.json'
  const details = await fetch({ path, videoID, lang })
  const result = await api
    .readJSON<{ details: VideoDetails; subs: string }>(path)
  assert(result.details)
  expect(result.details).toEqual(details)
  expect(result.subs).toBeDefined()
  stop()
})
