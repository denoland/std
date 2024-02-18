import { debug, expect, help, test } from '../tst-helpers.js'
const files = 'files'

help('ls /', async ({ help }) => {
  const result = await help(files)
  debug(result)
})
