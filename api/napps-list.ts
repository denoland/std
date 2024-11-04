import type { NappTypes as Files } from '@artifact/files'
import type { NappTypes as Fixture } from '@artifact/fixture'
import type { JsonValue } from './actions.ts'

type NappType = {
  [key: string]: (params: Record<string, JsonValue>) => unknown
}

export type NappTypes = Record<string, NappType> & {
  '@artifact/files': Files
  '@artifact/fixture': Fixture
}
