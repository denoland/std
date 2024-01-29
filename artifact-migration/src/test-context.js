import Artifact from './artifact/artifact'
import { expect as viexpect, test as vitest } from 'vitest'
import Debug from 'debug'
const _debug = Debug('test')
export const debug = (...args) => {
  return _debug(...args)
}
debug.enable = Debug.enable.bind(Debug)
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
