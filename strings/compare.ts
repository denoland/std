// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Return a number comparing two strings lexicographically.
 *
 * @example
 * ```ts
 * import { compare } from "https://deno.land/std@$STD_VERSION/strings/compare.ts";
 *
 * compare("a", "b"); // -1
 * compare("a", "a"); // 0
 * compare("b", "a"); // 1
 */

export function compare(a: string, b: string): number {
  if (a === b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else {
    return 1;
  }
}
