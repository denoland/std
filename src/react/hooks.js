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
    const unsubscribe = artifact.subscribe(path, setFile)
    return () => {
      unsubscribe()
      setFile(undefined)
    }
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

export const useActions = (path) => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  const { artifact } = useContext(ArtifactContext)
  const [actions, setActions] = useState()
  const [error, setError] = useState()
  if (error) {
    throw error
  }
  useEffect(() => {
    if (!artifact) {
      setActions()
      return
    }
    let active = true
    artifact
      .actions(path)
      .then((actions) => {
        if (active) {
          setActions(actions)
        }
      })
      .catch((error) => {
        if (active) {
          if (error.message.startsWith('ENOENT')) {
            setActions()
            return
          }
          setError(error)
          setActions()
        }
      })
    return () => {
      active = false
    }
  }, [artifact, path])
  return actions
}

export const usePrompt = (path = '/chat-1.io.json') => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  // TODO change to be a wrapper around useAction
  const actions = useActions(path)
  const [buffer, setBuffer] = useState([])
  const [prompt, setPrompt] = useState()
  const { artifact } = useContext(ArtifactContext)
  const [error, setError] = useState()
  if (error) {
    throw error
  }

  useEffect(() => {
    if (!actions) {
      return
    }
    setPrompt(() => actions.prompt)
  }, [actions])

  useEffect(() => {
    if (!artifact) {
      return
    }
    artifact.chatUp().catch(setError)
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

export const useCommits = (depth = 1, path = '/') => {
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

export const useLatestCommit = (path = '/') => {
  const commits = useCommits(1, path)
  return commits[0]
}
