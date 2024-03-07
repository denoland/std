import Server from './api/server.ts'

const server = await Server.create()
Deno.serve(server.fetch)
