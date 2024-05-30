// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { join as posixJoin } from "./posix/join.ts";
import { join as windowsJoin } from "./windows/join.ts";

/**
 * Join all given a sequence of paths, then normalizes the resulting path.
 *
 * @param paths Paths to be joined and normalized.
 *
 * @returns The joined and normalized path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/join";
 *
 * // posix
 * join("/foo", "bar", "baz/quux", "garply", ".."); // "/foo/bar/baz/quux"
 *
 * // win32
 * join("C:\\foo", "bar", "baz\\quux", "garply", ".."); // "C:\\foo\\bar\\baz\\quux"
 * ```
 */
export function join(...paths: string[]): string {
  return isWindows ? windowsJoin(...paths) : posixJoin(...paths);
}
