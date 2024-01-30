import { debug, expect, help, test } from '../test-context.js'
const files = 'files'

help('ls /', async ({ help }) => {
  debug.enable('*')
  const result = await help(files)
  debug(result)
})
