import Server from './api/server.ts'

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

const server = await Server.create(getPrivateKey(), getAesKey())
Deno.serve(server.fetch)
