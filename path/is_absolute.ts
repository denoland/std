// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { isAbsolute as posixIsAbsolute } from "./posix/is_absolute.ts";
import { isAbsolute as windowsIsAbsolute } from "./windows/is_absolute.ts";

/**
 * Verifies whether provided path is absolute
 *
 * @param path to be verified as absolute
 * @returns `true` if path is absolute, `false` otherwise
 *
 * @example Usage
 * ```ts
 * import { isAbsolute } from "@std/path/is-absolute";
 *
 * // posix
 * isAbsolute("/home/foo"); // true
 * isAbsolute("home/foo"); // false
 *
 * // win32
 * isAbsolute("C:\\home\\foo"); // true
 * isAbsolute("home\\foo"); // false
 * ```
 */
export function isAbsolute(path: string): boolean {
  return isWindows ? windowsIsAbsolute(path) : posixIsAbsolute(path);
}
