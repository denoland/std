// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import type { ParsedPath, PathOptions } from "./_interface.ts";
import { posixParse, windowsParse } from "./_parse.ts";

/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */
export function parse(path: string, options?: PathOptions): ParsedPath {
  return checkWindows(options?.os) ? windowsParse(path) : posixParse(path);
}
