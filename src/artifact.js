import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import loader from './boot/loader.md?raw'
import README from './boot/README.md?raw'
import Debug from 'debug'
const debug = Debug('AI:artifact')
globalThis.Buffer = Buffer

export default class Artifact {
  #fs
  #dir
  #cache
  #opts
  static async boot({ filesystemName = 'fs', wipe = false } = {}) {
    const artifact = new Artifact()
    const fs = new LightningFS(filesystemName, { wipe })
    artifact.#fs = fs.promises
    artifact.#dir = '/hal'
    artifact.#cache = {}
    artifact.#opts = {
      fs: artifact.#fs,
      dir: artifact.#dir,
      cache: artifact.#cache,
    }
    await artifact.#load()
  }
  async #load() {
    debug('checking repo')
    let isGitPresent = false
    try {
      const gitRoot = await git.findRoot(this.#opts)
      debug('gitRoot', gitRoot)
      isGitPresent = true
    } catch (e) {
      isGitPresent = false
    }
    if (!isGitPresent) {
      await this.init()
    }

    // then look for tension in the fs we just loaded

    // wait for user input

    // want to get to an api call out to openai, and can only use md files and ai to do so
    // the bootai is always present

    // with no AI, it should be at least a filesystem with base commands
    // TODO add an emergency exit sequence
  }
  async init() {
    debug('creating repo')
    await git.init({ fs: this.#fs, dir: '/hal' })
    const readmeP = this.#fs.writeFile(this.#dir + '/README.md', README)
    const loaderP = this.#fs.writeFile(this.#dir + '/loader.md', loader)
    await Promise.all([readmeP, loaderP])
    const status = await git.statusMatrix(this.#opts)
    const files = status.map((status) => status[0])
    await git.add({ ...this.#opts, filepath: files })
    await git.commit({
      ...this.#opts,
      message: 'boot',
      author: { name: 'HAL' },
    })
  }
}
