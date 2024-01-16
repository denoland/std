import { useContext, useEffect, useState, useCallback } from 'react'
import { ArtifactContext } from '../stories/Provider'
import assert from 'assert-fast'
import posix from 'path-browserify'
import Debug from 'debug'
const debug = Debug('AI:hooks')

export const useArtifact = (path) => {
  assert(posix.isAbsolute(path), `path must be absolute: ${path}`)
  const { artifact } = useContext(ArtifactContext)
  const [file, setFile] = useState()
  useEffect(() => {
    debug('useArtifact', path, artifact)
    if (!artifact) {
      return
    }
    const unsubscribe = artifact.subscribe(path, (file) => {
      setFile(file)
    })
    return () => {
      debug('useArtifact unmount', path)
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

export const useActions = (isolate) => {
  assert(!posix.isAbsolute(isolate), `path must be relative: ${isolate}`)
  const { artifact } = useContext(ArtifactContext)
  const [actions, setActions] = useState()
  const [error, setError] = useState()
  if (error) {
    throw error
  }
  useEffect(() => {
    debug('useActions', isolate, artifact)
    if (!artifact) {
      return
    }
    let active = true
    artifact
      .actions(isolate)
      .then((actions) => {
        if (active) {
          setActions(actions)
        }
      })
      .catch(setError)

    return () => {
      active = false
    }
  }, [artifact, isolate])
  return actions
}

export const usePrompt = () => {
  const isolate = 'chat'
  const actions = useActions(isolate)
  const [buffer, setBuffer] = useState([])
  const [prompt, setPrompt] = useState()
  const [error, setError] = useState()
  if (error) {
    throw error
  }

  useEffect(() => {
    if (!actions) {
      return
    }
    debug('setting prompt')
    setPrompt(() => actions.prompt)
  }, [actions])

  useEffect(() => {
    if (!prompt || !buffer.length) {
      return
    }
    for (const { resolve, text } of buffer) {
      debug('draining prompt buffer', text)
      prompt({ text }).then(resolve).catch(setError)
    }
    setBuffer([])
  }, [prompt, buffer])

  const bufferingPrompt = useCallback(
    async (text) => {
      assert(typeof text === 'string', `text must be a string`)
      assert(text, `text must not be empty`)
      if (!prompt) {
        debug('buffering prompt', text)
        let resolve
        const promise = new Promise((r) => (resolve = r))
        setBuffer((buffer) => [...buffer, { resolve, text }])
        return promise
      }
      debug('prompt', text)
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
    let active = true
    const subscriptionPromise = artifact.subscribeCommits(path, () => {
      if (!active) {
        return
      }
      // TODO get the root
      artifact.log({ filepath: path, depth }).then(setCommits)
    })
    return () => {
      debug('useCommits unmount', path)
      active = false
      subscriptionPromise.then((unsubscribe) => unsubscribe())
    }
  }, [depth, artifact, path])
  return commits
}

export const useLatestCommit = (path = '/') => {
  const commits = useCommits(1, path)
  return commits[0]
}
