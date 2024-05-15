import Server from '@/api/server.ts'
import { ArtifactSession } from '@/constants.ts'
import { init as githubInit } from '@/isolates/github.ts'
import { init as halInit } from '@/isolates/hal.ts'

const getPrivateKey = () => {
  const privateKey = Deno.env.get('SUPERUSER_PRIVATE_KEY')
  if (!privateKey) {
    throw new Error('SUPERUSER_PRIVATE_KEY not set')
  }
  return privateKey
}
const getAesKey = () => {
  const aesKey = Deno.env.get('AES_KEY')
  if (!aesKey) {
    throw new Error('AES_KEY not set')
  }
  return aesKey
}

const init = async (session: ArtifactSession) => {
  await Promise.all([githubInit(session), halInit(session)])
}

const server = await Server.create(getPrivateKey(), getAesKey(), init)
Deno.serve(server.fetch)
