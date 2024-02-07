import debug from '$debug'
import { expect } from 'https://deno.land/std@0.213.0/expect/mod.ts'

const _log = debug('AI:test')
export const log = (...args) => {
  return _log(...args)
}
export { expect }

// export const help = test.extend({
//   help: async ({ artifact, task }, use) => {
//     const text = task.name
//     const { engageInBand } = await artifact.actions('engage-help')
//     const help = (help) => engageInBand({ help, text })
//     await use(help)
//   },
// })

// export const goal = test.extend({
//   result: async ({ artifact, task }, use) => {
//     const text = task.name
//     const { engage } = await artifact.actions('engage-help')
//     const result = await engage({ help: 'goalie', text })
//     await use(result)
//   },
// })
