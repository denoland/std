// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { normalize as posixNormalize } from "./posix/normalize.ts";
import { normalize as windowsNormalize } from "./windows/normalize.ts";
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 * @returns normalized path
 * 
 * @example Usage
 * ```ts
 * import { normalize } from "@std/path/normalize";
 * 
 * // posix
 * normalize("/foo/bar/./baz/.././quux"); // "/foo/bar/quux"
 * 
 * // win32
 * normalize("C:\\foo\\bar\\.\\baz\\..\\.\\quux"); // "C:\\foo\\bar\\quux"
 * ```
 */
export function normalize(path: string): string {
  return isWindows ? windowsNormalize(path) : posixNormalize(path);
}
