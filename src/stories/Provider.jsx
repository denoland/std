import { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Artifact from '../exec/artifact'

let resolve
const artifactPromise = new Promise((r) => (resolve = r))
export const ArtifactContext = createContext({
  artifactPromise,
})

// should it be given a path to chroot to ?

// TODO move to a serviceworker
let artifactSingleton

export const Provider = ({ children, wipe = false }) => {
  // boot up artifact
  const [artifact, setArtifact] = useState()
  useEffect(() => {
    if (!artifactSingleton) {
      Artifact.boot({
        path: 'artifact',
        wipe,
      }).then((artifact) => {
        artifactSingleton = artifact
        resolve(artifact)
        setArtifact(artifact)
      })
    }
  }, [wipe])

  return (
    <ArtifactContext.Provider value={{ artifact, artifactPromise }}>
      {children}
    </ArtifactContext.Provider>
  )
}
Provider.propTypes = {
  children: PropTypes.node,
  wipe: PropTypes.bool,
}
