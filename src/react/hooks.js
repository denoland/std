import { useContext, useEffect, useState, useCallback } from 'react'
import { ArtifactContext } from '../stories/Provider'
import assert from 'assert-fast'
import posix from 'path-browserify'

export const useArtifact = (path) => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  const { artifact } = useContext(ArtifactContext)
  const [file, setFile] = useState()
  useEffect(() => {
    if (!artifact) {
      return
    }
    return artifact.subscribe(path, setFile)
  }, [artifact, path])
  return file
}

export const useArtifactJSON = (path) => {
  const file = useArtifact(path)
  if (file === undefined) {
    return
  }
  return JSON.parse(file)
}

export const useAction = (path) => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  const { artifact } = useContext(ArtifactContext)
  const file = useArtifact(path) // TODO gracefully check existence
  assert(file, `channel must be defined`)
  const channel = JSON.parse(file)
  // TODO check the format of the channel
  const { actions, length } = channel
  return async (parameters) => {
    assert(typeof parameters === 'object', `parameters must be an object`)
    // TODO produce schema functions for the channel

    const next = {
      actions: { ...actions, [length]: parameters },
      length: length + 1,
    }

    await artifact.write(path, JSON.stringify(next))
  }
}

export const usePrompt = (path = '/') => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  // TODO change to be a wrapper around useAction
  const { artifact } = useContext(ArtifactContext)
  const [buffer, setBuffer] = useState([])
  const [prompt, setPrompt] = useState()
  useEffect(() => {
    if (!artifact) {
      return
    }
    artifact.chatUp().then((actions) => setPrompt(() => actions.prompt))
  }, [artifact])
  useEffect(() => {
    if (!prompt || !buffer.length) {
      return
    }
    for (const { resolve, text } of buffer) {
      prompt({ text }).then(resolve)
    }
    setBuffer([])
  }, [prompt, buffer])
  const bufferingPrompt = useCallback(
    async (text) => {
      assert(typeof text === 'string', `text must be a string`)
      assert(text, `text must not be empty`)
      if (!prompt) {
        let resolve
        const promise = new Promise((r) => (resolve = r))
        setBuffer((buffer) => [...buffer, { resolve, text }])
        return promise
      }
      return await prompt({ text })
    },
    [prompt]
  )
  return bufferingPrompt
}

export const useCommits = (depth = 1, path = '.') => {
  assert(Number.isInteger(depth), `depth must be an integer: ${depth}`)
  assert(depth > 0, `depth must be greater than 0: ${depth}`)
  // TODO fix pathing
  //   assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  const { artifact } = useContext(ArtifactContext)
  const [commits, setCommits] = useState([])

  useEffect(() => {
    if (!artifact) {
      return
    }
    const subscriptionPromise = artifact.subscribeCommits(path, () => {
      // TODO get the root
      artifact.log({ filepath: path, depth }).then(setCommits)
    })
    return () => {
      subscriptionPromise.then((unsubscribe) => unsubscribe())
    }
  }, [depth, artifact, path])
  return commits
}

export const useLatestCommit = (path = '.') => {
  const commits = useCommits(1, path)
  return commits[0]
}
