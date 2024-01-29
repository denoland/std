import assert from 'assert-fast'
import { within } from '@storybook/test'

const play = (steps) => async ({ canvasElement, step }) => {
  assert(Array.isArray(steps), `steps must be an array`)
  within(canvasElement) // else addon crashes
  let diff
  for (let fn of steps) {
    const fnName = typeof fn === 'string' ? fn : fn.name
    const name = fnName + (diff ? `  (+${diff}ms)` : '')
    fn = typeof fn === 'string' ? () => {} : fn
    await step(name, () => {
      const time = Date.now()
      return Promise.resolve()
        .then(() => fn())
        .then(() => {
          diff = Date.now() - time
        })
    })
  }
}
export default play
