import { mockCreator, removeSnapshotsFile } from '@/isolates/utils/mocker.ts'
import { z } from 'zod'
import { expect } from '@utils'

Deno.test('inject inside a test', () => {
  const mock = mockCreator(z.string())
  const id = 'test-id'

  mock.inject(id, '1')
  mock.inject(id, '2')

  let callbackCount = 0
  let payload
  mock.subscribe(id, (_payload) => {
    callbackCount++
    payload = _payload
  })

  expect(mock.next(id)).toEqual('1')
  expect(callbackCount).toEqual(1)
  expect(payload).toEqual('1')

  expect(mock.next(id)).toEqual('2')
  expect(callbackCount).toEqual(2)
  expect(payload).toEqual('2')
})

Deno.test('record results to file', async (t) => {
  const schema = z.object({ test: z.string() })
  const writer = mockCreator(schema)
  const id = 'test-actor-id'
  writer.store(id, { test: '1' })
  expect(writer.next(id)).toBeUndefined()

  removeSnapshotsFile(t)

  writer.useRecorder(id, t)
  writer.store(id, { test: '2' })

  writer.teardown(id)

  const reader = mockCreator(schema)
  reader.useRecorder(id, t)
  expect(reader.next(id)).toEqual({ test: '2' })
  expect(reader.next(id)).toBeUndefined()

  reader.teardown(id)

  await t.step('nested', (t) => {
    const id = 'nested-id'
    const writer = mockCreator(schema)
    writer.useRecorder(id, t)
    writer.store(id, { test: '3' })
    writer.teardown(id)

    const reader = mockCreator(schema)
    reader.useRecorder(id, t)
    expect(reader.next(id)).toEqual({ test: '3' })
    expect(reader.next(id)).toBeUndefined()
    reader.teardown(id)
  })

  removeSnapshotsFile(t)
})

// TODO test the injection being stale and auto malleating

// TODO test concurrent file access modifications failing

// why not just record directly when the recorder gets turned on ?
