import Cradle from './cradle.ts'
import guts from './guts/guts.ts'

const cradleMaker = async () => {
  const { engine, client } = await Cradle.create()
  // create the system chain - fail without it
  // make a client bound to the superuser chain

  // start up the client for the a given root chain
  // start a client for this chain to receive pierce instructions on ?

  return cradle
}

guts('Queue', cradleMaker)
