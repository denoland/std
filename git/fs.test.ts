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

    fs.write(path, 'data')
    await expect(fs.read('hello.txt')).resolves.toBe('data')
    fs.delete(path)
    await expect(fs.read('hello.txt')).rejects.toThrow('Could not find file or')
    fs.write(path, data)
    await expect(fs.read('hello.txt')).resolves.toBe(data)

    const nextfs = await fs.commit()
    const read = await nextfs.read('hello.txt')
    expect(read).toBe(data)
  })
  db.stop()
})

// TODO block isolates from accessing .git paths

// check that a nonexistent pid throws
