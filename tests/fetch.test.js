import { debug, help, expect } from '../src/test-context'

help(
  'login',
  async ({ help }) => {
    debug.enable('*ai-result*')
    const result = await help('login-github')
    debug(result)
  },
  1200000
)
