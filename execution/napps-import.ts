/**
 * Ensures that in deno deploy, these packages are available to be read from, as
 * deno deploy has no dynamic runtime imports
 */

import type { NappTypes } from '@artifact/api'

import * as files from '@artifact/files'

const napps: { [K in keyof NappTypes]: unknown } = { '@artifact/files': files }

export default napps
