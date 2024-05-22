// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { relative as posixRelative } from "./posix/relative.ts";
import { relative as windowsRelative } from "./windows/relative.ts";

/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * @param from path in current working directory
 * @param to path in current working directory
 * @returns relative path from `from` to `to`
 *
 * @example Usage
 * ```ts
 * import { relative } from "@std/path/relative";
 *
 * // posix
 * relative("/data/orandea/test/aaa", "/data/orandea/impl/bbb"); // "../../impl/bbb"
 *
 * // win32
 * relative("C:\\orandea\\test\\aaa", "C:\\orandea\\impl\\bbb"); // "..\\..\\impl\\bbb"
 * ```
 */
export function relative(from: string, to: string): string {
  return isWindows ? windowsRelative(from, to) : posixRelative(from, to);
}
