// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixExtname, windowsExtname } from "./_extname.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Return the extension of the `path` with leading period.
 * @param path with extension
 * @returns extension (ex. for `file.ts` returns `.ts`)
 */
export function extname(path: string, options?: PathOptions): string {
  return checkWindows(options?.os) ? windowsExtname(path) : posixExtname(path);
}
