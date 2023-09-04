// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixRelative, windowsRelative } from "./_relative.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * An example in windws, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 *
 * @param from path in current working directory
 * @param to path in current working directory
 */
export function relative(
  from: string,
  to: string,
  options?: PathOptions,
): string {
  return checkWindows(options?.os)
    ? windowsRelative(from, to)
    : posixRelative(from, to);
}
