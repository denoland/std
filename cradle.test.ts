import Cradle from './cradle.ts'
import guts from './guts/guts.ts'

const cradleMaker = async () => {
  const cradle = await Cradle.create()
  return cradle
}

guts('Queue', cradleMaker)
