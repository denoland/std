import git from '$git'
import { ENTRY_BRANCH, IFs, PID } from '@/constants.ts'
import { assert } from '@utils'

const dir = '/'

export default async (fs: IFs, repo: string) => {
  const [account, repository] = repo.split('/')
  const pid: PID = { account, repository, branches: [ENTRY_BRANCH] }
  assert(!fs.existsSync(dir + '.git'), 'fs already exists')

  await git.init({ fs, dir, defaultBranch: ENTRY_BRANCH })
  const author = { name: 'git init' }
  // need this so we can have a commit value, required by the isolate-api
  const commit = await git.commit({
    fs,
    dir,
    message: 'initial commit',
    author,
  })
  return { pid, commit }
}
