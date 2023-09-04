// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixIsAbsolute, windowsIsAbsolute } from "./_is_absolute.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */
export function isAbsolute(path: string, options?: PathOptions): boolean {
  return checkWindows(options?.os)
    ? windowsIsAbsolute(path)
    : posixIsAbsolute(path);
}
