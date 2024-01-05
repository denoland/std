import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Artifact from '../exec/artifact'

export const ArtifactContext = createContext({})

// should it be given a path to chroot to ?

export const Provider = ({ children, wipe = false }) => {
  // boot up artifact
  const [artifact, setArtifact] = useState()
  useEffect(() => {
    // TODO move to a serviceworker
    Artifact.boot({
      path: 'artifact',
      wipe,
    }).then(setArtifact)
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
