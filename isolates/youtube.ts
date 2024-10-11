import { Functions, ToApiType } from '@/constants.ts'
import {
  getSubtitles,
  getVideoDetails,
  type VideoDetails,
} from 'youtube-caption-extractor'
import { Debug } from '@utils'
import { z } from 'zod'

const log = Debug('AI:youtube')

export { type VideoDetails }

export const parameters = {
  fetch: z.object({
    path: z.string().regex(/.*\.json$/).describe(
      'Relative path to save the fetched transcription result.  Must end in ".json" and must start with "./"',
    ),
    videoID: z
      .string()
      .describe(
        'The last part of a YouTube URL. For example, in the URL https://www.youtube.com/watch?v=zIB7YsC34Tc, the videoID is "zIB7YsC34Tc"',
      ),
    lang: z
      .string()
      .optional()
      .describe('Language code for the subtitles - defaults to "en"'),
  }).strict()
    .describe(
      'Fetch video details and subtitles (subs).  This will write the transcription json object to the given path, and return that path if everything was ok',
    ),
}
export const returns = {
  fetch: z.object({
    success: z.boolean().describe('Whether the fetch was successful'),
    path: z.string().describe('The path to the saved transcription json file'),
  }),
}

export type Api = ToApiType<typeof parameters, typeof returns>

export const functions: Functions<Api> = {
  async fetch({ path, videoID, lang = 'en' }, api) {
    const details = await fetchVideoDetails(videoID, lang)
    const subs: VideoDetails['subtitles'] | string = await fetchSubtitles(
      videoID,
      lang,
    )
    const transcript = subs.map(({ start, text }) => ({ start, text }))
    api.writeJSON(path, { details, transcript })
    return { success: true, path }
  },
}

const fetchSubtitles = async (videoID: string, lang = 'en') => {
  const subtitles = await getSubtitles({ videoID, lang })
  log(subtitles)
  return subtitles
}

const fetchVideoDetails = async (videoID: string, lang = 'en') => {
  const videoDetails = await getVideoDetails({ videoID, lang })
  const { subtitles, ...rest } = videoDetails
  log('details had subtitles:', !!subtitles)
  return rest
}
