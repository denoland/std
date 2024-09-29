import { createMockApi } from '@/tests/fixtures/mock-api.ts'
import * as tpsReport from '@/isolates/tps-report.ts'
import { expect } from '@std/expect/expect'

Deno.test('tps-report', async () => {
  const { api, stop } = await createMockApi('agent/format')
  api.read = (path: string) => {
    return Promise.resolve(Deno.readTextFileSync('./HAL/' + path))
  }
  api.readOid = (path: string) => {
    if (path === testPath) {
      return Promise.resolve('d41d8cd98f00b204e9800998ecf8427e4902d2c6')
    }
    throw new Error('file not found')
  }
  const testPath = 'tests/test-fixture.test.md'
  const agent = 'agents/agent-fixture.md'
  const assessor = 'agents/test-assessor.md'
  const iterations = 0

  const ok = tpsReport.functions.upsert({
    reasoning: [],
    testPath,
    agent,
    assessor,
    iterations,
  }, api)
  await expect(ok).resolves.not.toThrow()

  const falseTestPath = tpsReport.functions.upsert({
    reasoning: [],
    testPath: 'tests/invalid.test.md',
    agent,
    assessor,
    iterations,
  }, api)
  await expect(falseTestPath).rejects.toThrow('file not found')

  const falseAgent = tpsReport.functions.upsert({
    reasoning: [],
    testPath,
    agent: 'agents/invalid.md',
    assessor,
    iterations,
  }, api)
  await expect(falseAgent).rejects.toThrow('No such file or directory')

  const falseAssessor = tpsReport.functions.upsert({
    reasoning: [],
    testPath,
    agent,
    assessor: 'agents/invalid.md',
    iterations,
  }, api)
  await expect(falseAssessor).rejects.toThrow('No such file or directory')
  stop()
})
