/**
 * Ensures that in deno deploy, these packages are available to be read from.
 * Also ensures the typings are correct during development.
 */

import * as files from '@artifact/files'

export default {
  '@artifact/files': files,
}
