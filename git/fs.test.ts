import { expect } from '@utils'
import DB from '@/db.ts'
import FS from './fs.ts'
Deno.test('git/init', async (t) => {
  const db = await DB.create()
  let fs: FS
  await t.step('init', async () => {
    const repo = 'account/repo'

    fs = await FS.init(repo, db)
    await expect(fs.read('hello.txt')).rejects.toThrow(
      'Could not find file or',
    )
  })
  await t.step('write', async () => {
    const path = 'hello.txt'
    const data = 'world'

    await expect(fs.exists(path)).resolves.toBeFalsy()
    fs.write(path, 'data')
    await expect(fs.exists(path)).resolves.toBeTruthy()
    await expect(fs.read(path)).resolves.toBe('data')
    fs.delete(path)
    await expect(fs.exists(path)).resolves.toBeFalsy()
    await expect(fs.read(path)).rejects.toThrow('Could not find file or')
    fs.write(path, data)
    await expect(fs.exists(path)).resolves.toBeTruthy()
    await expect(fs.read(path)).resolves.toBe(data)

    const next = await fs.writeCommit('write single')
    const read = await next.read(path)
    expect(read).toBe(data)
    await expect(next.exists(path)).resolves.toBeTruthy()

    fs = next
  })
  await t.step('write nested', async () => {
    const path = 'nested/deep/hello.txt'
    const data = 'world'

    await expect(fs.exists(path)).resolves.toBeFalsy()
    fs.write(path, 'data')
    await expect(fs.exists(path)).resolves.toBeTruthy()
    await expect(fs.read(path)).resolves.toBe('data')
    fs.delete(path)
    await expect(fs.exists(path)).resolves.toBeFalsy()
    await expect(fs.read(path)).rejects.toThrow('Could not find file or')
    fs.write(path, data)
    await expect(fs.exists(path)).resolves.toBeTruthy()
    await expect(fs.read(path)).resolves.toBe(data)

    const next = await fs.writeCommit('write nested')
    await expect(next.exists(path)).resolves.toBeTruthy()
    const read = await next.read(path)
    expect(read).toBe(data)
    const oldRead = await next.read('hello.txt')
    expect(oldRead).toBe(data)
    fs = next
  })
  await t.step('logs', async () => {
    const logs = await fs.logs()
    expect(logs.length).toBe(3)
  })
  await t.step('delete', async () => {
    const path = 'hello.txt'
    fs.delete(path)
    await expect(fs.read(path)).rejects.toThrow('Could not find file or')
    const next = await fs.writeCommit('delete')
    await expect(next.exists(path)).resolves.toBeFalsy()
    await expect(next.read(path)).rejects.toThrow('Could not find file or')
  })
  db.stop()
})
Deno.test('clone', async (t) => {
  const db = await DB.create()
  await t.step('clone HAL', async () => {
    const fs = await FS.clone('dreamcatcher-tech/HAL', db)
    expect(fs.commit).toHaveLength(40)
  })
  db.stop()
})

// TODO block isolates from accessing .git paths

// check that a nonexistent pid throws
// TODO test writing a file that hashes to the same as the existing one
// this should result in no commit being made.  IO always changes, so this
// should still commit, but there should be no other file changes attempted.
