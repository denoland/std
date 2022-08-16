// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  Column,
  ColumnDetails,
  DataItem,
  NEWLINE,
  stringify,
  StringifyOptions,
} from "./csv.ts";

/**
 * Provides {@linkcode stringify} to encode data following the
 * [CSV specification](https://tools.ietf.org/html/rfc4180).
 *
 * This module is browser compatible.
 *
 * @module
 */

/**
 * @deprecated This file will be removed soon. Use `Error` instead.
 */
export class StringifyError extends Error {
  override readonly name = "StringifyError";
}

export type {
  /**
   * @deprecated This file will be removed soon. Import from "./csv.ts" instead.
   */
  Column,
  /**
   * @deprecated This file will be removed soon. Import from "./csv.ts" instead.
   */
  ColumnDetails,
  /**
   * @deprecated This file will be removed soon. Import from "./csv.ts" instead.
   */
  DataItem,
  /**
   * @deprecated This file will be removed soon. Import from "./csv.ts" instead.
   */
  StringifyOptions,
};

export {
  /**
   * @deprecated This file will be removed soon. Use `"\r\n"` instead.
   */ NEWLINE,
  /**
   * @deprecated This file will be removed soon. Import from "./csv.ts" instead.
   */
  stringify,
};
