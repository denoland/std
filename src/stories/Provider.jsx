import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Artifact from '../artifact/artifact'
import Debug from 'debug'
const debug = Debug('AI:Provider')

export const ArtifactContext = createContext({})

// should it be given a path to chroot to ?

export const Provider = ({ children, wipe = true }) => {
  // boot up artifact
  const [artifact, setArtifact] = useState()
  const [error, setError] = useState()
  if (error) {
    throw error
  }
  useEffect(() => {
    // TODO move to a serviceworker
    debug('booting')
    const promise = Artifact.boot({
      path: 'artifact',
      wipe,
    })
    let active = true
    promise
      .then((artifact) => {
        if (active) {
          setArtifact(artifact)
        }
      })
      .catch((error) => {
        if (active) {
          return
        }
        setError(error)
      })
    return () => {
      debug('shutdown')
      active = false
      setArtifact()
      promise.then((artifact) => artifact.stop())
    }
  }, [wipe])

  return (
    <ArtifactContext.Provider value={{ artifact }}>
      {children}
    </ArtifactContext.Provider>
  )
}
Provider.propTypes = {
  children: PropTypes.node,
  wipe: PropTypes.bool,
}
