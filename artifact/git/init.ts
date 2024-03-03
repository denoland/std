import { IFs } from 'https://esm.sh/v135/memfs@4.6.0/lib/index.js'
import git from '$git'
import { ENTRY_BRANCH, PID } from '@/artifact/constants.ts'
import { assert } from '$std/assert/assert.ts'

const dir = '/'

export default async (fs: IFs, repo: string) => {
  const [account, repository] = repo.split('/')
  const pid: PID = { account, repository, branches: [ENTRY_BRANCH] }
  assert(!fs.existsSync(dir + '.git'), 'fs already exists')

  await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })
  return pid
}
