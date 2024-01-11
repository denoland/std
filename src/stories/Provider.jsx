import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Artifact from '../exec/artifact'
import Debug from 'debug'
const debug = Debug('AI:Provider')

export const ArtifactContext = createContext({})

// should it be given a path to chroot to ?

export const Provider = ({ children, wipe = false }) => {
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
    promise.then(setArtifact).catch(setError)
    return () => {
      debug('shutdown')
      promise.then((artifact) => {
        setArtifact((current) => {
          if (current !== artifact) {
            return current
          }
        })
      })
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
