import Debug from 'debug'
import { AI } from './runner-chat.js'
import assert from 'assert-fast'
const debug = Debug('AI:runner-injector')

export default async ({ path, text }) => {
  assert(typeof path === 'string', 'path must be an string')
  assert(typeof text === 'string', 'text must be a string')
  debug('injector:', path, text)

  // TODO move this to be inside the loadHelp file
  const imports = import.meta.glob('../helps/*.js')

  const helps = []
  let injectee
  for (const _path in imports) {
    const name = _path.substring(
      '../helps/'.length,
      _path.length - '.js'.length
    )
    const { default: help } = await imports[_path]()
    if (name == path) {
      injectee = help
      continue
    }
    helps.push({ name, help })
  }
  injectee = { ...injectee }
  injectee.instructions = [...injectee.instructions]
  for (const others of helps) {
    injectee.instructions.push(JSON.stringify(others, null, 2))
  }
  const ai = await AI.create(injectee)
  return await ai.prompt(text)
}
