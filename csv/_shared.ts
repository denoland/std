// Copyright 2018-2025 the Deno authors. MIT license.

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
