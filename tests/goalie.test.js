import { expect, goal, debug } from '../src/test-context'

debug.enable('test *ai-result* ')

goal('what files do I have ?', async ({ result }) => {
  debug(result)
  const files = ['.git', 'helps', '.io.json', 'chat-1.session.json']
  files.forEach((file) => {
    expect(result).toContain(file)
  })
})
goal('add a file named "hello"', async ({ result, task }) => {
  debug('task:', task.name)
  debug(result)
  expect(result).toContain('hello')
})
