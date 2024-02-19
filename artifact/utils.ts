import 'npm:supports-color'
import Debug from 'npm:debug'
export { expect } from 'https://deno.land/std@0.213.0/expect/mod.ts'
Debug.enable('')
export { Debug }
export const log = Debug('AI:tests')
