import { Tip } from './tip.ts'
import { MockProvider } from './mock-provider.ts'
import { expect } from '@std/expect/expect'
import { assert } from '@std/assert/assert'

Deno.test('mock provider', async (t) => {
  const provider = MockProvider.create()
  expect(await provider.snapshots.latest()).toBeUndefined()
  expect(await provider.snapshots.parents()).toEqual([])
  expect(await provider.snapshots.history()).toEqual([])
  const commit = provider.commit(new Map(), new Set())
  await expect(commit).rejects.toThrow('No changes to commit')

  await expect(provider.read.binary('a')).rejects.toThrow('Could not find')

  await provider.commit(new Map([['a', { text: 'hello' }]]), new Set())
  const id = await provider.snapshots.latest()
  assert(id, 'id should be defined')

  expect(await provider.read.text('a')).toEqual('hello')

  await provider.commit(new Map(), new Set(['a']))
  expect(await provider.read.exists('a')).toEqual(false)

  const recovered = await provider.read.text('a', { snapshot: id })
  expect(recovered).toEqual('hello')

  const latest = await provider.snapshots.latest()
  expect(latest).not.toEqual(id)
  expect(await provider.snapshots.parents()).toEqual([id])
  expect(await provider.snapshots.parents({ snapshot: id })).toEqual([])
})

Deno.test('snapshot', async (t) => {
  const provider = MockProvider.create()

  const tip = Tip.create(provider)
  expect(tip.isChanged).toEqual(false)
  await expect(tip.commit()).rejects.toThrow('No changes to commit')

  await tip.write.text('a', 'hello')
  expect(await tip.read.text('a')).toEqual('hello')
  expect(tip.isChanged).toEqual(true)

  tip.write.rm('a')
  expect(await tip.read.exists('a')).toEqual(false)
  await expect(tip.read.text('a')).rejects.toThrow('Could not find')
  expect(tip.isChanged).toEqual(false)

  await expect(tip.read.meta('a')).rejects.toThrow('Could not find')

  await tip.write.text('a', 'hello again')
  await tip.commit()
  expect(tip.isChanged).toEqual(false)
  await expect(tip.read.exists('a')).resolves.toEqual(true)
  expect(await tip.read.text('a')).toEqual('hello again')
})
