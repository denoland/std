// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Test wheter str begins with prefix.
 *
 * @example
 * ```ts
 * hasPrefix("Deno", "De"); // true
 * hasPrefix("Deno", "C"); // false
 * hasPrefix("Deno", ""); // true
 * hasPrefix("Deno", "d"); //false
 * ```
 */

export function hasPrefix(str: string, prefix: string): boolean {
  if (str.length >= prefix.length && str.slice(0, prefix.length) === prefix) {
    return true;
  } else {
    return false;
  }
}
