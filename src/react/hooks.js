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
  useEffect(() => {
    if (!artifact || !buffer.length) {
      return
    }
    for (const { resolve, text } of buffer) {
      artifact.prompt(text).then(resolve)
    }
    setBuffer([])
  }, [artifact, buffer])
  const prompt = useCallback(
    async (text) => {
      assert(typeof text === 'string', `text must be a string`)
      assert(text, `text must not be empty`)
      if (!artifact) {
        let resolve
        const promise = new Promise((r) => (resolve = r))
        setBuffer((buffer) => [...buffer, { resolve, text }])
        return promise
      }
      return await artifact.prompt(text)
    },
    [artifact]
  )
  return prompt
}

export const useCommits = (depth = 1, path) => {
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
    const subscription = artifact.subscribeCommits(path, () => {
      artifact.log({ filepath: path, depth }).then(setCommits)
    })
    // TODO handle race condition in initial commits
    artifact.log({ filepath: path, depth }).then(setCommits)
    return subscription
  }, [depth, artifact, path])
  return commits
}

export const useLatestCommit = (path) => {
  const commits = useCommits(1, path)
  return commits[0]
}
