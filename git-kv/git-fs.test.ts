import { expect } from '@std/expect/expect'
import DB from '../engine/db.ts'
import FS from '../snapshots/tip.ts'

Deno.test('git/init', async (t) => {
  const db = await DB.create(DB.generateAesKey())
  let fs: FS
  await t.step('init', async () => {
    const repo = 'account/repo'
    const pid = partialFromRepo(repo)
    fs = await FS.init(pid, db)
    await expect(fs.read('hello.txt')).rejects.toThrow(
      'Could not find hello.txt',
    )
    expect(await db.readHead(fs.pid)).toBe(fs.oid)
  })
  // BUT should all paths be available, since git is running at a different
  // layer ?
  await t.step('git paths', async () => {
    const git = 'git paths are forbidden: '
    const json = 'path must be *.json'
    const paths = [
      '.git',
      '.git/something',
      '.git/objects/something',
      '.git/refs',
      '.git/refs/heads',
      '.git/refs/heads/main',
    ]
    const trailing = [...paths, ...paths.map((path) => path + '/')]
    const forwards = [
      ...trailing,
      ...trailing.map((path) => '/' + path),
    ]
    for (const path of forwards) {
      expect(() => fs.write(path, ''), path).toThrow(git)
      expect(() => fs.write(path, 'data'), path).toThrow(git)
      expect(() => fs.writeJSON(path, ''), path).toThrow(json)
      expect(() => fs.writeJSON(path, 'data'), path).toThrow(json)
      expect(() => fs.delete(path), path).toThrow(git)
      await expect(fs.read(path), path).rejects.toThrow(git)
      await expect(fs.readBinary(path), path).rejects.toThrow(git)
      await expect(fs.readJSON(path), path).rejects.toThrow(json)
      await expect(fs.ls(path), path).rejects.toThrow(git)
      await expect(fs.exists(path), path).rejects.toThrow(git)
      if (path) {
        expect(() => fs.logs(path), path).toThrow(git)
      }
    }
  })
  await t.step('complicated paths', async () => {
    const paths = [
      '',
      '.',
      '/',
      '/something',
      '/something/deep',
      '//something',
    ]
    for (const path of paths) {
      if (['', '.', '/'].includes(path)) {
        expect(() => fs.write(path, ''), path).toThrow()
        expect(() => fs.write(path, 'data'), path).toThrow()
        expect(() => fs.writeJSON(path, ''), path).toThrow()
        expect(() => fs.writeJSON(path, 'data'), path).toThrow()
        expect(() => fs.delete(path), path).toThrow()
        await expect(fs.ls(path), path).resolves.not.toThrow()
        await expect(Promise.resolve(fs.logs(path)), path).resolves.not
          .toThrow()
      } else {
        expect(() => fs.delete(path), path).not.toThrow()
      }
      await expect(fs.read(path), path).rejects.toThrow()
      await expect(fs.readBinary(path), path).rejects.toThrow()
      await expect(fs.readJSON(path), path).rejects.toThrow()
      await expect(fs.exists(path), path).resolves.not.toThrow()
    }
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

    expect(await db.readHead(fs.pid)).toBe(fs.oid)
    const { next } = await fs.writeCommitObject('write single')
    expect(await db.readHead(fs.pid), 'commit changed head').toBe(fs.oid)

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

    const { next } = await fs.writeCommitObject('write nested')
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
    const { next } = await fs.writeCommitObject('delete')
    await expect(next.exists(path)).resolves.toBeFalsy()
    await expect(next.read(path)).rejects.toThrow('Could not find hello.txt')

    fs = next
  })
  db.stop()
})
Deno.test('clone and pull', async (t) => {
  const db = await DB.create(DB.generateAesKey())
  let fs: FS
  await t.step('clone HAL', async () => {
    fs = await FS.clone('dreamcatcher-tech/HAL', db)
    expect(fs.oid).toHaveLength(40)
  })
  await t.step('read', async () => {
    const path = 'README.md'
    const data = await fs.read(path)
    expect(data).toContain('AI')
  })
  await t.step('fetch', async () => {
    const oid = await FS.fetch('dreamcatcher-tech/HAL', fs.pid, db)
    expect(oid).toEqual(fs.oid)
  })

  // insert the PAT into the github repo
  // do a push, using this auth method

  // make a new branch
  // push this up to the git repo for testing

  db.stop()
})
Deno.test('merge', async (t) => {
  const db = await DB.create(DB.generateAesKey())
  let fs = await FS.init(partialFromRepo('test/merge'), db)

  await t.step('merge', async () => {
    fs.write('hello.txt', 'world')
    const { next } = await fs.writeCommitObject('merge')
    const oid = await next.merge(fs.oid)
    expect(oid).not.toEqual(fs.oid)
    fs = next
  })
  await t.step('merge conflict', async () => {
    const readme = await fs.read('hello.txt')
    expect(readme).toBe('world')

    fs.write('hello.txt', 'conflict 1')
    const { next } = await fs.writeCommitObject('merge')

    const pid = addPeer(fs.pid, 'conflict')
    const branch = fs.branch(pid)
    branch.write('hello.txt', 'conflict 2')
    const { next: branchNext } = await branch.writeCommitObject('branch')

    const oid = await next.merge(branchNext.oid)

    const merged = FS.open(next.pid, oid, db)
    const readmeMerged = await merged.read('hello.txt')
    expect(readmeMerged).toContain('conflict 1')
    expect(oid).not.toEqual(fs.oid)
  })

  db.stop()
})
Deno.test('overwrite', async () => {
  const db = await DB.create(DB.generateAesKey())
  const pid = partialFromRepo('test/merge')
  const base = await FS.init(pid, db)
  base.write(IO_PATH, '0')
  base.write('a.txt', 'a')
  base.write('b.txt', 'b')
  base.write('c/c.txt', 'c')
  base.write('c/d.txt', 'd')
  const { next } = await base.writeCommitObject('initial')
  const childPid = addBranches(next.pid, 'child')
  const branch = next.branch(childPid)

  branch.write(IO_PATH, '1')
  branch.write('a.txt', 'A')
  branch.delete('c/c.txt')
  branch.write('c/e.txt', 'e')
  branch.write('c/d.txt', 'D')
  const { next: branchNext } = await branch.writeCommitObject('branch')

  await next.overwrite(branchNext.oid, 'c/c.txt')
  expect(await next.read(IO_PATH)).toBe('0')
  expect(await branchNext.read(IO_PATH)).toBe('1')

  expect(await next.read('a.txt')).toBe('A')
  expect(await next.read('b.txt')).toBe('b')
  expect(await next.read('c/c.txt')).toBe('c')
  expect(await branchNext.exists('c/c.txt')).toBeFalsy()
  expect(await next.read('c/d.txt')).toBe('D')
  expect(await next.read('c/e.txt')).toBe('e')

  db.stop()
})
// TODO block isolates from accessing .git paths

// check that a nonexistent pid throws
// TODO test writing a file that hashes to the same as the existing one
// this should result in no commit being made.  IO always changes, so this
// should still commit, but there should be no other file changes attempted.
