import Compartment from '@/io/compartment.ts'
import { Api, VideoDetails } from './youtube.ts'
import { expect } from '@utils'
import { createMockApi } from '@/tests/fixtures/mock-api.ts'
Deno.test('youtube', async () => {
  const compartment = await Compartment.create('youtube')
  const { api, stop } = await createMockApi('test/youtube')
  const { fetch } = compartment.functions<Api>(api)

  const videoID = 'zIB7YsC34Tc'
  const lang = 'en'

  const path = 'test/youtube/fetch.json'
  const result = await fetch({ path, videoID, lang })
  expect(result.path).toEqual(path)
  expect(result.success).toBeTruthy()

  const data = await api
    .readJSON<
      { details: VideoDetails; transcript: { start: string; text: string }[] }
    >(path)

  expect(data.details).toBeDefined()
  expect(data.transcript).toBeDefined()
  stop()
})
