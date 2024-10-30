import type { NappTypes as FilesApi } from '@artifact/files'
import type { JsonValue } from './actions.ts'

type BaseFunction = (parameters: Record<string, JsonValue>) => unknown
type BaseRecord = Record<string, BaseFunction>

export type NappTypes = Record<string, BaseRecord> & {
  '@artifact/files': FilesApi
}
