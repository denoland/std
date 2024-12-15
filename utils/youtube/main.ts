import ytdl from '@distube/ytdl-core'

const url = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'
const audioStream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })

const file = await Deno.open('audio.m4a', { create: true, write: true })
await audioStream.pipeTo(file.writable)
