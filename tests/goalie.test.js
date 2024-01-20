import { expect, test, debug } from '../src/test-context'

const help = 'goalie'

test.only('what files do I have ?', async ({ artifact, task }) => {
  debug.enable('AI:runner-chat test')
  const text = task.name
  const { engage } = await artifact.actions('engage-help')
  const result = await engage({ help, text })
  debug(result)
  const files = ['.git', 'helps', '.io.json', 'chat-1.session.json']
  files.forEach((file) => {
    expect(result).toContain(file)
  })
})
