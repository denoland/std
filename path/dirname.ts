// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixDirname, windowsDirname } from "./_dirname.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Return the directory path of a `path`.
 * @param path - path to extract the directory from.
 */
export function dirname(path: string, options?: PathOptions): string {
  return checkWindows(options?.os) ? windowsDirname(path) : posixDirname(path);
}
