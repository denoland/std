/**
 * Ensures that in deno deploy, these packages are available to be read from, as
 * deno deploy has no dynamic runtime imports
 */

import * as files from '@artifact/files'
import * as fixture from '@artifact/fixture'

const napps = {
  '@artifact/files': files,
  '@artifact/fixture': fixture,
}

export default napps
