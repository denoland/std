// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Test wheter str ends with suffix.
 *
 * @example
 * ```ts
 * hasPrefix("Calvin", "in"); // true
 * hasPrefix("Calvin", "n"); // true
 * hasPrefix("Calvin", ""); // true
 * hasPrefix("Calvin", "Cal"); //false
 * ```
 */

export function hasSuffix(str: string, suffix: string): boolean {
  if (str.endsWith(suffix)) return true;
  else return false;
}
