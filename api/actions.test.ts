import functionCreator from './actions.ts'
import { expect } from '@std/expect'
import { assert } from '@std/assert'

Deno.test('functions', async (t) => {
  const functions = await functionCreator('@artifact/files')
  expect(functions).toHaveProperty('write')

  assert(functions.write, 'write function not found')
  expect(functions.write).toThrow('Invalid parameters')
  const result = functions.write({ path: 'test.txt', content: 'hello world' })
  expect(result).toEqual({
    napp: '@artifact/files',
    tool: 'write',
    parameters: { path: 'test.txt', content: 'hello world' },
    files: [],
  })
})
