import posix from 'path-browserify'
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import loader from '../boot/loader.md?raw'
import README from '../boot/README.md?raw'
import assert from 'assert-fast'
import promptRunner from './prompt-runner.js'
import TriggerFS from './trigger-fs.js'
import Debug from 'debug'
const debug = Debug('AI:artifact')
globalThis.Buffer = Buffer

export default class Artifact {
  #fs
  #dir
  #cache
  #opts
  #session
  #trigger
  static async boot({ filesystem, path = 'fs', wipe = false } = {}) {
    const artifact = new Artifact()
    const prefix = filesystem ? path : ''
    if (!filesystem) {
      filesystem = new LightningFS(path, { wipe })
    }
    artifact.#trigger = TriggerFS.create()
    artifact.#fs = filesystem.promises
    artifact.#dir = prefix + '/hal'
    artifact.#session = prefix + '/hal/.session.json'
    artifact.#cache = {}
    artifact.#opts = {
      fs: artifact.#fs,
      dir: artifact.#dir,
      cache: artifact.#cache,
    }
    await artifact.#load()
    return artifact
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

    // want to get to an api call out to openai, and can only use md files and ai to do so
    // the bootai is always present

    // with no AI, it should be at least a filesystem with base commands
    // TODO add an emergency exit key sequence to default the pipe
  }
  async init() {
    debug('creating repo')
    await this.#fs.mkdir(this.#dir).catch((e) => {
      if (!e.message.startsWith('EEXIST')) {
        throw e
      }
    })
    await git.init(this.#opts)
    const readmeP = this.#fs.writeFile(this.#dir + '/README.md', README)
    const loaderP = this.#fs.writeFile(this.#dir + '/loader.md', loader)
    const sessionP = this.#fs.writeFile(this.#session, JSON.stringify([]))
    await Promise.all([readmeP, loaderP, sessionP])
    const status = await git.statusMatrix(this.#opts)
    const files = status.map((status) => status[0])
    await git.add({ ...this.#opts, filepath: files })
    await git.commit({
      ...this.#opts,
      message: 'boot',
      author: { name: 'HAL' },
    })
    this.#trigger.commit()
  }
  async prompt(text) {
    assert(typeof text === 'string', `text must be a string`)
    assert(text, `text must not be empty`)

    // should be able to make a function call in a generic way
    // so a call to the AI should be defined how any call is made

    // .pipe tells it what file to put it in, what code to use to do that,
    // and what continuation action to take afterwards.

    // inputs:
    // - path to the session file
    // - text the user just put in

    // outputs:
    // - a file will be updated or created
    // - the ai will be called
    // - the ai will stream its responses back into the file

    // read in the response when done
    // carry on with whatever we were doing ?

    // V1
    // - read in the session file, which is .json
    // - obtain lock on the session file
    // - modify the json with the latest prompt
    // - write the json back to the session file
    // - do a commit and release the lock
    // - trigger an api call to openai using the given file

    // - openai api function grabs lock on the session file
    // - reads the session file
    // - makes the openai api, streaming the results back into the session file
    // - releases the lock
    // - makes a commit with the user being the api caller
    // - system now waits for the next prompt / driver / tension

    const sessionPath = this.#session
    const trigger = this.#trigger
    await promptRunner({ fs: this.#fs, sessionPath, text, trigger })
    await git.commit({
      ...this.#opts,
      message: 'promptRunner',
      author: { name: 'promptRunner' },
    })
    this.#trigger.commit()
  }
  async read(path) {
    assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
    const contents = await this.#fs.readFile(this.#dir + path, 'utf8')
    return contents
  }
  async log({ filepath, depth }) {
    const log = await git.log({ ...this.#opts, filepath, depth })
    return log
  }
  subscribe(path, cb) {
    const initial = this.#fs.readFile(path, 'utf8')
    return this.#trigger.subscribe(path, cb, initial)
  }
  subscribeCommits(path, cb) {
    return this.#trigger.subscribeCommits(path, cb)
  }
}
