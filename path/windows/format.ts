// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { _format, assertArg } from "../_common/format.ts";
import type { ParsedPath } from "../types.ts";

/**
 * Generate a path from `ParsedPath` object.
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/path/windows/format";
 * import { assertEquals } from "@std/assert";
 *
 * const path = format({
 *   root: "C:\\",
 *   dir: "C:\\path\\dir",
 *   base: "file.txt",
 *   ext: ".txt",
 *   name: "file"
 * });
 * assertEquals(path, "C:\\path\\dir\\file.txt");
 * ```
 *
 * @param pathObject The path object to format.
 * @returns The formatted path.
 */
export function format(pathObject: Partial<ParsedPath>): string {
  assertArg(pathObject);
  return _format("\\", pathObject);
}
