import Debug from 'npm:debug'
const debug = Debug('github-auth')
Debug.enable('github-auth')
const allowedOrigins = [
  'http://localhost:5173',
  'hal.dreamcatcher.land',
  'aritfact-github-auth.deno.dev',
]

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  debug('origin', origin)
  if (!allowedOrigins.includes(origin)) {
    return new Response(`forbidden origin: ${origin}`, { status: 401 })
  }
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Content-Type': 'application/json',
  })
  if (req.method === 'OPTIONS') {
    // Preflight Request
    return new Response(null, {
      status: 200,
      headers,
    })
  }
  try {
    const body = await req.json()
    debug('body', body)
    const { mode, code } = body
    if (!code) {
      throw new Error('code not provided')
    }
    if (mode && mode !== 'development') {
      throw new Error('mode was: ' + mode)
    }
    const client_id = Deno.env.get(mode ? 'DEV_CLIENT_ID' : 'CLIENT_ID')
    const client_secret = Deno.env.get(
      mode ? 'DEV_CLIENT_SECRET' : 'CLIENT_SECRET'
    )

    debug('secrets', client_id, client_secret)
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    }
    const tokenUrl = 'https://github.com/login/oauth/access_token'
    const token = await fetch(tokenUrl, requestOptions).then((response) =>
      response.json()
    )

    return new Response(JSON.stringify(token), {
      status: 200,
      headers,
    })
  } catch (error) {
    return new Response(error, { status: 500, headers })
  }
})
