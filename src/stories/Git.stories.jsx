import play from './play'
import { Page } from '../examples/Page'
import { useEffect } from 'react'
import git from 'isomorphic-git'
import LightningFS from '@isomorphic-git/lightning-fs'
import { Buffer } from 'buffer'
import Debug from 'debug'
import Artifact from '../exec/artifact'
import { Provider } from './Provider'
import { useArtifact, useLatestCommit, usePrompt } from '../react/hooks'
globalThis.Buffer = Buffer

// do 10k customer records
// then sync it down from a server

// truncation means you can recover it from history, but keeps the context small

// use the stuck loop to control how the system behaves ?
// stucks as a base dir.

// make a folder:
// get the help that matches this goal
// use any context that is relevant, of which there might be none
// figure out what to do - the currect focus might be something special

// maintain a vector db of what is store in the filesystem, particularly in the
// stucks folder, which is indexed by goal.

// make a simple calculator to do some math via function calls
// do some lensing

// make two bots talk to each other, and also allow you to talk directly to a bot

// githooks, so when changes come in, system integrity can be maintained
// possibly githooks are how all functions are triggered

// generate an image and store it

// generate a task list of things to do
// reprioritize it
// provide all the features of the todolist in redux

// push a backup to github

// load the sysprompt
// edit the sysprompt from within hal
// do an action that triggers some conventional code
// then convert the api calls to openai to do this conventional way

// implement the stuckloop

// do some distributed computing where multiple machines reach consensus

// pull in npm packages using SSRI and ipfs

// push stucks to a remote repo

// write to a file

// sort customers

// ping google

// stucks, if they sound generic, should include default offerings to try do some more things by searching wider

export default {
  title: 'Git',
  component: Page,
}

const Renderer = () => {
  const session = useArtifact('/hal/.session.json')
  const prompt = usePrompt('/hal/.session.json')
  useEffect(() => {
    if (prompt) {
      prompt('say a single word')
    }
  }, [prompt])
  const commit = useLatestCommit()
  return (
    <>
      <div>{session}</div>
      <br />
      <div>{JSON.stringify(commit, null, 2)}</div>
    </>
  )
}

export const Subscribe = () => {
  return (
    <Provider wipe>
      <Renderer />
    </Provider>
  )
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
