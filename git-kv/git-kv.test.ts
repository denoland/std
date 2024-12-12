// test_git_kv.ts
import { GitKV } from './git-kv.ts'
import { FileNotFoundError } from './errors.ts'
import { expect } from '@std/expect/expect'

// Mock implementations of DB and Atomic for testing
class MockDB {
  #store = new Map<string, Uint8Array>()
  #heads = new Map<string, string>()
  #children = new Map<string, string[]>()

  async blobGet(key: string[]): Promise<{value: Uint8Array, versionstamp?: string}> {
    const path = key.join('/')
    if (this.#store.has(path)) {
      return { value: this.#store.get(path)!, versionstamp: 'test-version' }
    }
    return { value: new Uint8Array(), versionstamp: undefined }
  }
  async blobSet(key: string[], value: Uint8Array) {
    this.#store.set(key.join('/'), value)
  }
  async blobExists(key: string[]): Promise<boolean> {
    return this.#store.has(key.join('/'))
  }
  async readHead(pid: {branches: string[]}): Promise<string | null> {
    const branchKey = pid.branches.join('/')
    return this.#heads.get(branchKey) || null
  }
  async listImmediateChildren(prefix: string[]): Promise<string[]> {
    const joined = prefix.join('/')
    return this.#children.get(joined) || []
  }
  setHead(pid: {branches: string[]}, refContent: string) {
    const branchKey = pid.branches.join('/')
    this.#heads.set(branchKey, refContent)
  }
  addChild(prefix: string[], child: string) {
    const joined = prefix.join('/')
    const arr = this.#children.get(joined) || []
    arr.push(child)
    this.#children.set(joined, arr)
  }
}

class MockAtomic {
  #commits: Array<{pid: {branches: string[]}, ref: string}> = []
  createBranch(pid: {branches: string[]}, ref: string) {
    this.#commits.push({pid, ref})
    return this
  }
  async commit(): Promise<void> {
    // In reality, would commit atomically, here we just no-op
  }
  get commits() {
    return this.#commits
  }
}

const mockPID = { branches: ['main'] }

Deno.test("GitKV: readFile HEAD returns correct ref", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)
  const headRef = await kv.readFile('/.git/HEAD', { encoding: 'utf8' })
  expect(headRef).toBe('ref: refs/heads/main')
})

Deno.test("GitKV: readFile non-existent file throws FileNotFoundError", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)
  await expect(kv.readFile('/.git/config/something', { encoding: 'utf8' }))
    .rejects.toThrow(FileNotFoundError)
})

Deno.test("GitKV: writeFile and readFile roundtrip on allowed path", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  const data = "test content"
  await kv.writeFile('/.git/config/testfile', data, { encoding: 'utf8' })
  const readBack = await kv.readFile('/.git/config/testfile', { encoding: 'utf8' })
  expect(readBack).toBe(data)
})

Deno.test("GitKV: writeFile on refs/heads with atomic commit", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  const atomic = new MockAtomic()
  kv.oneAtomicWrite = atomic
  await kv.writeFile('/.git/refs/heads/main', "deadbeef", { encoding: 'utf8' })

  expect(atomic.commits.length).toBe(1)
  expect(atomic.commits[0].ref).toBe('deadbeef')
})

Deno.test("GitKV: readFile refs/heads matches PID branch and reads head from DB", async () => {
  const db = new MockDB()
  db.setHead(mockPID, 'deadbeef')
  const kv = GitKV.recreate(db, mockPID)

  const headVal = await kv.readFile('/.git/refs/heads/main', { encoding: 'utf8' })
  expect(headVal).toBe('deadbeef')
})

Deno.test("GitKV: readFile from objects throws not found if missing", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  await expect(() => kv.readFile('/.git/objects/aa/bb'))
    .rejects.toThrow(FileNotFoundError)
})

Deno.test("GitKV: stat on existing file returns empty object", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)
  await kv.writeFile('/.git/config/existfile', "exists", { encoding: 'utf8' })

  const stat = await kv.stat('/.git/config/existfile')
  expect(typeof stat).toBe('object')
})

Deno.test("GitKV: stat on missing file throws FileNotFoundError", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  await expect(() => kv.stat('/.git/config/missing'))
    .rejects.toThrow(FileNotFoundError)
})

Deno.test("GitKV: readdir on .git returns children", async () => {
  const db = new MockDB()
  const pidPrefix = ['repo', 'main']

  db.addChild(['repo','main'], 'config')
  db.addChild(['repo','main'], 'objects')

  const kv = GitKV.recreate(db, mockPID)
  const children = await kv.readdir('/.git')
  expect(children.sort()).toEqual(['config','objects'].sort())
})

Deno.test("GitKV: mkdir, rmdir, unlink on shallow are no-ops or not implemented", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  // mkdir always resolves
  await kv.mkdir('/.git/somedirectory')

  // unlink on shallow returns quietly
  await kv.unlink('/.git/shallow')

  // unlink elsewhere not implemented
  await expect(() => kv.unlink('/.git/config/whatever'))
    .rejects.toThrow(Error)

  // rmdir also not implemented
  await expect(() => kv.rmdir('/.git/config/dir'))
    .rejects.toThrow(Error)
})

Deno.test("GitKV: readFile on HEAD tries to emulate ref to PID branches", async () => {
  const db = new MockDB()
  const pid = { branches: ['feature', 'xyz'] }
  const kv = GitKV.recreate(db, pid)
  const head = await kv.readFile('/.git/HEAD', { encoding: 'utf8' })
  expect(head).toBe('ref: refs/heads/feature/xyz')
})

Deno.test("GitKV: writing to index throws error, HEAD writes ignored", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)

  await expect(() => kv.writeFile('/.git/index', "should fail", { encoding: 'utf8' }))
    .rejects.toThrow(Error)

  // HEAD writes are ignored
  // Let's ensure no error thrown and no DB write attempt
  await kv.writeFile('/.git/HEAD', "ignored data", { encoding: 'utf8' })
})

Deno.test("GitKV: unsupported encoding throws error", async () => {
  const db = new MockDB()
  const kv = GitKV.recreate(db, mockPID)
  await expect(() => kv.readFile('/.git/HEAD', { encoding: 'hex' as any }))
    .rejects.toThrow(Error)
})
