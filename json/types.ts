// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** The type of the result of parsing JSON. */
export type JsonValue =
  | { [key: string]: JsonValue | undefined }
  | JsonValue[]
  | string
  | number
  | boolean
  | null;
