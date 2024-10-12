import { createMockApi } from '@/tests/fixtures/mock-api.ts'
import * as tpsReport from '@/isolates/tps-report.ts'
import { expect } from '@std/expect/expect'

Deno.test('tps-report', async () => {
  const { api, stop } = await createMockApi('agent/format')
  api.read = (path: string) => {
    return Promise.resolve(Deno.readTextFileSync('./HAL/' + path))
  }
  api.readOid = (_path: string) => {
    if (_path === path) {
      return Promise.resolve('d41d8cd98f00b204e9800998ecf8427e4902d2c6')
    }
    throw new Error('file not found')
  }
  const path = 'tests/test-fixture.test.md'
  const target = 'agents/agent-fixture.md'
  const assessor = 'agents/test-assessor.md'
  const iterations = 0

  const ok = tpsReport.functions.upsert({
    reasoning: [],
    path,
    target,
    assessor,
    iterations,
    cases: [],
  }, api)
  await expect(ok).resolves.not.toThrow()

  const falseTestPath = tpsReport.functions.upsert({
    reasoning: [],
    path: 'tests/invalid.test.md',
    target,
    assessor,
    iterations,
    cases: [],
  }, api)
  await expect(falseTestPath).rejects.toThrow('file not found')

  const falseAgent = tpsReport.functions.upsert({
    reasoning: [],
    path,
    target: 'agents/invalid.md',
    assessor,
    iterations,
    cases: [],
  }, api)
  await expect(falseAgent).rejects.toThrow('agents/invalid.md')

  const falseAssessor = tpsReport.functions.upsert({
    reasoning: [],
    path,
    target,
    assessor: 'agents/invalid.md',
    iterations,
    cases: [],
  }, api)
  await expect(falseAssessor).rejects.toThrow('agents/invalid.md')
  stop()
})
