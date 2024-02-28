import Cradle from './cradle.ts'
import guts from './_utils/guts.ts'

const cradleMaker = async () => {
  const cradle = await Cradle.create()
  return cradle
}

guts('Queue', cradleMaker)
