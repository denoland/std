import Box from '@mui/material/Box'
import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import assert from 'assert-fast'

const debug = Debug('AI:StateBoard')

export const StateBoard = ({ crisp }) => {
  const [target, setTarget] = useState()
  useEffect(() => {
    if (!crisp) {
      return
    }
    assert(crisp.absolutePath === '/', `"/" !== ${crisp.absolutePath}`)
    const { wd } = crisp
    if (!crisp.hasPath(wd)) {
      return
    }
    const next = crisp.getPath(wd)
    if (next !== target) {
      debug('setTarget', next)
      setTarget(next)
    }
  }, [crisp])

  // get the crisp at the path of the current WD
  // determine what type of object is at this location
  // look up our maps and try to display it
  // default to json or plain text

  // if nothing there or loading, show a loading screen
  // if collection then show the table
  // if datum then show using schema

  // map paths to or covenants to gui components
  //   const dir = crisp.
}
StateBoard.propTypes = {}

// stateboard could be loaded up with children that have route props
// either a path, a switch, or covenant
