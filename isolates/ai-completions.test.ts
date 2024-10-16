import { loadAgent } from '@/isolates/utils/load-agent.ts'
import { complete } from '@/isolates/ai-completions.ts'
import { functions, safeAssistantName } from '@/isolates/ai-completions.ts'
import { expect, log } from '@utils'
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

Deno.test.only('inject empty', async (t) => {
  const { api, stop } = await createMockApi('test/inject-single')
  const path = 'fake/agent.md'
  api.write(path, '')
  const agent = await loadAgent(path, api)

  const { mock } = complete
  log.enable('AI:mocker')
  const actorId = 'test-actor-id'
  mock.useRecorder(actorId, t)

  const result = await complete(agent, [{
    role: 'user',
    content: 'say cheese in emoji',
    name: actorId,
  }], api)

  console.dir(result, { depth: 10 })

  stop()
})
