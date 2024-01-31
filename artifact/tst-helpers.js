// import Artifact from './artifact/artifact'
import { debug as _debug } from '$debug'
const log = _debug('test')
export const debug = (...args) => {
  return log(...args)
}
_debug.enable = _debug.enable.bind(_debug)
export const expect = viexpect
export const test = vitest.extend({
  // eslint-disable-next-line no-empty-pattern
  artifact: async ({}, use) => {
    const artifact = await Artifact.boot()

    await use(artifact)

    await artifact.stop()
  },
})

export const help = test.extend({
  help: async ({ artifact, task }, use) => {
    const text = task.name
    const { engageInBand } = await artifact.actions('engage-help')
    const help = (help) => engageInBand({ help, text })
    await use(help)
  },
})

export const goal = test.extend({
  result: async ({ artifact, task }, use) => {
    const text = task.name
    const { engage } = await artifact.actions('engage-help')
    const result = await engage({ help: 'goalie', text })
    await use(result)
  },
})
