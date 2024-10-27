import { Debug, isKvTestMode } from '@/utils.ts'
import Server from '@/server/server.ts'
import { init } from '@/isolates/github.ts'
import { Engine } from '@/engine.ts'

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

Debug.enable(
  'AI:completions* AI:qbr AI:qex AI:server AI:engine AI:actors AI:hal AI:github AI:system',
)
const engine = await Engine.boot(getPrivateKey(), getAesKey())
const server = Server.create(engine, init)

const opts: { cert?: string; key?: string; hostname?: string; port?: number } =
  {}
if (isKvTestMode()) {
  opts.cert = Deno.readTextFileSync('tests/ssl/cert.pem')
  opts.key = Deno.readTextFileSync('tests/ssl/key.pem')
  opts.hostname = '127.0.0.1'
  opts.port = 9000
  console.log('loading test ssl certs')
}

Deno.serve(opts, server.fetch)
