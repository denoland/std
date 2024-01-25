import posix from 'path-browserify'
import Debug from 'debug'
import { AI } from './runner-chat.js'
import assert from 'assert-fast'
import * as hooks from '../artifact/io-hooks.js'
const debug = Debug('AI:runner-injector')

export default async ({ path, text }) => {
  assert(typeof path === 'string', 'path must be an string')
  assert(typeof text === 'string', 'text must be a string')
  debug('injector:', path, text)

  const files = await hooks.ls('/helps')
  debug('files', files)
  const helps = []
  let injectee
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filepath = `/helps/${file}`
      debug('filepath', filepath)
      const name = posix.basename(file, posix.extname(file))
      const help = await hooks.readJS(filepath)

      if (name === path) {
        injectee = help
      } else {
        helps.push({ name, help })
      }
    }
  }

  assert(injectee, `no help found for ${path}`)
  injectee = { ...injectee }
  injectee.instructions = [...injectee.instructions]
  for (const donor of helps) {
    // TODO include the commands api descriptions too
    injectee.instructions.push(JSON.stringify(donor, null, 2))
  }
  const ai = await AI.create(injectee)
  return await ai.prompt(text)
}
