// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { posixJoin, windowsJoin } from "./_join.ts";

/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */
export function join(...paths: string[]) {
  return isWindows ? windowsJoin(...paths) : posixJoin(...paths);
}
