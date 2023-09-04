// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { posixDirname, windowsDirname } from "./_dirname.ts";

/**
 * Return the directory path of a `path`.
 * @param path - path to extract the directory from.
 */
export function dirname(path: string): string {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
