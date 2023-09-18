// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import type { ParsedPath } from "../_path_common/interface.ts";
import { parse as posixParse } from "../path_posix/parse.ts";
import { parse as windowsParse } from "../path_windows/parse.ts";

/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */
export function parse(path: string): ParsedPath {
  return isWindows ? windowsParse(path) : posixParse(path);
}
