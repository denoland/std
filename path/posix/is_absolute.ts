// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isPosixPathSeparator } from "./_util.ts";

/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */
export function isAbsolute(path: string): boolean {
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
