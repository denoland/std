import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor'
import { Debug } from '@utils'
const log = Debug('AI:youtube')

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

export const api = {
  fetch: {
    description:
      'Fetch video details and subtitles (subs).  The videoID is the last part of a youtube url.  For example, in the url https://www.youtube.com/watch?v=zIB7YsC34Tc, the videoID is "zIB7YsC34Tc".',
    type: 'object',
    required: ['videoID'],
    additionalProperties: false,
    properties: {
      videoID: { type: 'string' },
      lang: { type: 'string' },
    },
  },
}
interface FetchArgs {
  videoID: string
  lang: string
}
export const functions = {
  async fetch({ videoID, lang = 'en' }: FetchArgs) {
    const details = await fetchVideoDetails(videoID, lang)
    const subs = await fetchSubtitles(videoID, lang)
    return { details, subs }
  },
}
