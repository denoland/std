// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Report whether a substring is within a string.
 *
 * @example
 * ```ts
 * import { contains } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * contains("Hello, Deno!", "Deno"); // true
 */

export function contains(s: string, substr: string): boolean {
  return s.includes(substr);
}
