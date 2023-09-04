// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixNormalize, windowsNormalize } from "./_normalize.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 */
export function normalize(path: string, options?: PathOptions): string {
  return checkWindows(options?.os)
    ? windowsNormalize(path)
    : posixNormalize(path);
}
