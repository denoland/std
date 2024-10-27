import * as openai from '@artifact/openai'
import { expect } from '@std/expect'
import { loadAgent } from '@/isolates/utils/load-agent.ts'
import { complete, functions, image, safeAssistantName } from './completions.ts'
import { createMockApi } from '@/tests/fixtures/mock-api.ts'

Deno.test('test the regex for agent name sanitization', () => {
  const result = safeAssistantName({
    role: 'assistant',
    name: 'agents/o1.md',
  })
  expect(result).toEqual({ role: 'assistant', name: 'agents_o1_md' })
})

Deno.test('generate images', async (t) => {
  image.mock.useRecorder(t)
  const { api, stop } = await createMockApi('test/images')
  const path = 'images/test.jpg'
  const result = await functions.image({
    path,
    prompt: 'a dystopian robot overlord mecha',
    lowQuality: true,
    size: '1024x1024',
    style: 'natural',
  }, api)
  const file = await api.readBinary(path)
  expect(file.byteLength).toBeGreaterThan(0)
  expect(file.byteLength).toEqual(result.size)

  image.mock.teardown()
  stop()
})

Deno.test('inject empty', async (t) => {
  complete.mock.useRecorder(t)
  const { api, stop } = await createMockApi('test/inject-single')
  const path = 'fake/agent.md'
  api.write(path, '')
  const agent = await loadAgent(path, api)

  const result = await complete(agent, [{
    role: 'system',
    content: 'say cheese in emoji',
  }], api)
  expect(result).toHaveProperty('assistant')
  expect(result).toHaveProperty('stats')

  complete.mock.teardown()
  stop()
})
