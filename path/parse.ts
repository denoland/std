// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import type { ParsedPath } from "./_interface.ts";
import { parse as posixParse } from "./posix/parse.ts";
import { parse as windowsParse } from "./windows/parse.ts";

export type { ParsedPath } from "./_interface.ts";

/**
 * Return a `ParsedPath` object of the `path`. Use `format` to reverse the result.
 *
 * @param path to process
 * @returns A `ParsedPath` object
 * 
 * @example Usage
 * ```ts
 * import { parse } from "@std/path";
 *
 * const parsedPathObj = parse("/path/to/dir/script.ts");
 * parsedPathObj.root; // "/"
 * parsedPathObj.dir; // "/path/to/dir"
 * parsedPathObj.base; // "script.ts"
 * parsedPathObj.ext; // ".ts"
 * parsedPathObj.name; // "script"
 * ```
 */
export function parse(path: string): ParsedPath {
  return isWindows ? windowsParse(path) : posixParse(path);
}
