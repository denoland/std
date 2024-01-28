import express from 'npm:express'
import corsProxy from 'npm:@isomorphic-git/cors-proxy/middleware.js'
import Debug from 'npm:debug'
const debug = Debug('cors')

const app = express()
const options = {}
app.use(corsProxy(options))
app.listen(3000)
