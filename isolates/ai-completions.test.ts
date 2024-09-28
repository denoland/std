import { functions, safeAssistantName } from '@/isolates/ai-completions.ts'
import { expect } from '@utils'
import { createMockApi } from '@/tests/fixtures/mock-api.ts'
Deno.test('test the regex for agent name sanitization', () => {
  const result = safeAssistantName({
    role: 'assistant',
    name: 'agents/o1.md',
  })
  expect(result).toEqual({ role: 'assistant', name: 'agents_o1_md' })
})
Deno.test('generate images', async () => {
  const { api, stop } = await createMockApi('test/images')
  const path = 'images/test.png'
  const result = await functions.image({
    path,
    prompt: 'a dystopian robot overload mecha',
    lowQuality: true,
    size: '1024x1024',
    style: 'natural',
  }, api)
  const image = await api.readBinary(path)
  expect(image.byteLength).toBeGreaterThan(0)
  expect(image.byteLength).toEqual(result.size)
  stop()
})
