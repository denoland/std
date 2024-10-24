import {
  getFilename,
  mockCreator,
  removeSnapshotsFile,
} from '@/isolates/utils/mocker.ts'
import { z } from 'zod'
import { expect } from '@utils'

Deno.test('inject inside a test', (t) => {
  const mock = mockCreator(z.string())
  mock.useRecorder(t)

  const id = 'test-id'
  mock.inject(id, '1')
  mock.inject(id, '2')

  let callbackCount = 0
  let payload
  mock.subscribe((_payload, id) => {
    callbackCount++
    payload = _payload
    expect(id).toEqual('test-id')
  })

  expect(mock.next(id)).toEqual('1')
  expect(callbackCount).toEqual(1)
  expect(payload).toEqual('1')

  expect(mock.next(id)).toEqual('2')
  expect(callbackCount).toEqual(2)
  expect(payload).toEqual('2')

  mock.teardown()
})

Deno.test('record results to file', async (t) => {
  const schema = z.object({ test: z.string() })
  const writer = mockCreator(schema)

  const id = 'test-actor-id'
  writer.store(id, { test: '1' })
  expect(writer.next(id)).toBeUndefined()

  removeSnapshotsFile(t)

  writer.useRecorder(t)
  writer.store(id, { test: '2' })

  writer.teardown()

  const reader = mockCreator(schema)
  reader.useRecorder(t)
  expect(reader.next(id)).toEqual({ test: '2' })
  expect(reader.next(id)).toBeUndefined()

  reader.teardown()

  await t.step('nested', (t) => {
    const id = 'nested-id'
    const writer = mockCreator(schema)
    writer.useRecorder(t)
    writer.store(id, { test: '3' })
    writer.teardown()

    const reader = mockCreator(schema)
    reader.useRecorder(t)
    expect(reader.next(id)).toEqual({ test: '3' })
    expect(reader.next(id)).toBeUndefined()
    reader.teardown()
  })

  removeSnapshotsFile(t)
})

Deno.test('double step', async (t) => {
  removeSnapshotsFile(t)
  const mock = mockCreator(z.string())

  await t.step('substep', (t) => {
    mock.useRecorder(t)
    const id = 'test-id-1'
    mock.store(id, '1')
    mock.teardown()
  })

  await t.step('substep', (t) => {
    mock.useRecorder(t)
    const id = 'test-id-2'
    mock.store(id, '2')
    mock.teardown()
  })
})

const firstName = 'first top level test'
Deno.test(firstName, (t) => {
  const mock = mockCreator(z.string())
  mock.useRecorder(t)
  const id = 'test-id'
  mock.store(id, '1')
  mock.teardown()
})
const secondName = 'second top level test'
Deno.test(secondName, async (t) => {
  const mock = mockCreator(z.string())
  mock.useRecorder(t)
  const id = 'test-id'
  mock.store(id, '2')
  mock.teardown()

  await t.step('check file', () => {
    const filename = getFilename(t)
    const text = Deno.readTextFileSync(filename)
    const json = JSON.parse(text)
    expect(json).toHaveProperty(firstName)
    expect(json).toHaveProperty(secondName)
  })
})

Deno.test('duplicate recording fails', async (t) => {
  const mock = mockCreator(z.string())
  mock.useRecorder(t)

  await t.step('substep', (t) => {
    const mock = mockCreator(z.string())
    expect(() => mock.useRecorder(t)).toThrow('recorder already active')
  })
  mock.teardown()
})

Deno.test('different schemas', (t) => {
  removeSnapshotsFile(t)
  const schema1 = z.string()
  const schema2 = z.number()

  const mock = mockCreator(schema1)
  mock.useRecorder(t)

  const id1 = 'test-id1'
  mock.store(id1, '1')
  mock.teardown()

  const mock2 = mockCreator(schema2)
  mock2.useRecorder(t)

  const id2 = 'test-id2'
  mock2.store(id2, 2)
  mock2.teardown()
})

Deno.test('cleanup', (t) => {
  removeSnapshotsFile(t)
})
