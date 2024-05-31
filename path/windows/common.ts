// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { _common } from "../_common/common.ts";
import { SEPARATOR } from "./constants.ts";

/** Determines the common path from a set of paths, using an optional separator,
 * which defaults to the OS default separator.
 *
 * @example Usage
 * ```ts
 * import { common } from "@std/path/windows/common";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const path = common([
 *   "C:\\foo\\bar",
 *   "C:\\foo\\baz",
 * ]);
 * assertEquals(path, "C:\\foo\\");
 * ```
 *
 * @param paths The paths to compare.
 * @param sep The separator to use. Defaults to `\\`.
 * @returns The common path.
 */
export function common(
  paths: string[],
  sep: string = SEPARATOR,
): string {
  return _common(paths, sep);
}
