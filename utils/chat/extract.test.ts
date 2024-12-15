import { expect } from '@std/expect/expect'
import { extract } from './extract.ts'

const start = `# Conversation

### Message ID: 2ae52d22-dba5-457d-8147-faade76900dd
**Author**: system

**Content:**



---`

const id = '6758f810-286c-800b-8e2c-490e634ca002'
Deno.test('extractConversation from example.html', async () => {
  const html = await Deno.readTextFile('./example.html')
  const [creationTime, conversation] = await extract(html, id)
  expect(conversation.startsWith(start)).toBeTruthy()
  expect(creationTime.startsWith('2024-12-11')).toBeTruthy()
})

Deno.test('extractConversation handles empty HTML', async () => {
  await expect(extract('', id)).rejects.toThrow(
    'Could not find a <script> tag',
  )
})

Deno.test('extractConversation handles HTML with no conversation', async () => {
  const html = '<html><body><p>No conversation here</p></body></html>'
  await expect(extract(html, id)).rejects.toThrow(
    'Could not find a <script> tag',
  )
})
