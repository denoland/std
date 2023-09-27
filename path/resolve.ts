// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { posixResolve, windowsResolve } from "./_resolve.ts";

/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */
export function resolve(...pathSegments: string[]): string {
  return isWindows
    ? windowsResolve(...pathSegments)
    : posixResolve(...pathSegments);
}
