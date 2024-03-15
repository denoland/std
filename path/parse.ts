// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import type { ParsedPath } from "./_interface.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";

/**
 * Return a `ParsedPath` object of the `path`. Use `format` to reverse the result.
 * @example
 * ```ts
 * const parsedPathObj = parse("c:\\path\\dir\\index.html")
 * console.log(parsedPathObj)
 * {
 *   root: "c:\\",
 *   dir: "c:\\path\\dir",
 *   base: "index.html",
 *   ext: ".html",
 *   name: "index"
 * }
 * ```
 * @param path to process
 */
export function parse(path: string): ParsedPath {
  return isWindows ? windowsParse(path) : posixParse(path);
}
