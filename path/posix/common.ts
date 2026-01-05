// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { common as _common } from "../_common/common.ts";
import { SEPARATOR } from "./constants.ts";

/** Determines the common path from a set of paths for POSIX systems.
 *
 * @example Usage
 * ```ts
 * import { common } from "@std/path/posix/common";
 * import { assertEquals } from "@std/assert";
 *
 * const path = common([
 *   "./deno/std/path/mod.ts",
 *   "./deno/std/fs/mod.ts",
 * ]);
 * assertEquals(path, "./deno/std/");
 * ```
 *
 * @param paths The paths to compare.
 * @returns The common path.
 */
export function common(paths: string[]): string {
  return _common(paths, SEPARATOR);
}
