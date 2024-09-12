import { safeAssistantName } from '@/isolates/ai-completions.ts'
import { expect } from '@utils'
Deno.test('test the regex for agent name sanitization', () => {
  const result = safeAssistantName({
    role: 'assistant',
    name: 'agents/o1.md',
  })
  expect(result).toEqual({ role: 'assistant', name: 'agents_o1_md' })
})
