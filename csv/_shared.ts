// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Gives the length of a string in Unicode code points
 *
 * ```
 * codePointLength("🐱"); // 1
 * "🐱".length; // 2
 * ```
 */
export function codePointLength(s: string) {
  return Array.from(s).length;
}
