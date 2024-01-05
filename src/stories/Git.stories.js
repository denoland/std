import play from './play'
import { Page } from '../examples/Page'

import git from 'isomorphic-git'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import Debug from 'debug'
import Artifact from '../exec/artifact'
globalThis.Buffer = Buffer

// do 10k customer records
// then sync it down from a server

// need a bootloader, to start the execution engine with some defaults.
// starts the LLM and the first chat thing.

// chat is just adding a message to the git file.
// truncation means you can recover it from history, but keeps the context small

// create the base fs on disk, the upload it to the browser version.

// OPERATIONS:
// 1.

// use the stuck loop to control how the system behaves ?
// stucks as base dir ?

// make a folder:
// get the help that matches this goal
// use any context that is relevant, of which there might be none
// figure out what to do - the currect focus might be something special

// maintain a vector db of what is store in the filesystem, particularly in the
// stucks folder, which is indexed by goal.

// make a simple calculator
// do some lensing

// githooks, so when changes come in, system integrity can be maintained

export default {
  title: 'Git',
  component: Page,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
}

const fs = new LightningFS('fs', { wipe: true })
const dir = '/test'
const cache = {}
let files
const count = 5

export const Manual = {
  play: play([
    `using ${count} files`,
    async function init() {
      await git.init({
        fs,
        dir,
        cache,
      })
    },
    async function write() {
      const promises = []
      console.time('write')
      for (let i = 0; i < count; i++) {
        const promise = fs.promises.writeFile(
          dir + `/hello-${i}.txt`,
          'Hello World',
          'utf8'
        )
        promises.push(promise)
      }
      await Promise.all(promises)
      console.timeEnd('write')
    },
    async function status() {
      const status = await git.statusMatrix({ fs, dir, cache })
      files = status.map((status) => status[0])
    },
    async function add() {
      await git.add({ fs, dir, filepath: files, cache })
    },
    async function commit() {
      await git.commit({
        fs,
        dir,
        message: 'Initial commit',
        author: { name: 'mcnasty' },
        cache,
      })
    },
    async function log() {
      const log = await git.log({ fs, dir })
      console.log(log)
    },
  ]),
}

let artifact
export const ArtifactBoot = {
  play: play([
    async function initArtifact() {
      Debug.enable('*artifact')
      artifact = await Artifact.boot({
        path: 'Git.stories',
        wipe: true,
      })
    },
    async function prompt() {
      await artifact.prompt('say a single word')
      const session = await artifact.read('/.session.json')
      const messages = JSON.parse(session)
      console.log(messages)
    },
    async function prompt() {
      await artifact.prompt('say what again')
      const session = await artifact.read('/.session.json')
      const messages = JSON.parse(session)
      console.log(messages)
    },
  ]),
}
