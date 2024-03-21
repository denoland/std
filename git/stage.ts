import { assert, Debug, posix } from '@utils'
import git from '$git'
import { IFs } from '@/constants.ts'

const log = Debug('AI:git:stage')

export default async (fs: IFs, upserts: string[], deletes: string[]) => {
  assertFiles(upserts, deletes)
  log('stage', upserts, deletes)
  // TODO affirm the head commit is the one we are updating
  for (const filepath of upserts) {
    log('add', filepath)
    assert(fs.existsSync('/' + filepath), `file does not exist: ${filepath}`)
    await git.add({ fs, dir: '/', filepath })
  }
  for (const filepath of deletes) {
    log('remove', filepath)
    await git.remove({ fs, dir: '/', filepath })
  }
}
const assertFiles = (upserts: string[], deletes: string[]) => {
  const all = [...upserts, ...deletes]
  assert(all.length > 0, 'no files to induct')
  assert(all.every((file) => !posix.isAbsolute(file)), 'file must be relative')
  const upsertSet = new Set(upserts)
  assert(deletes.every((file) => !upsertSet.has(file)), 'file in both sets')
}
