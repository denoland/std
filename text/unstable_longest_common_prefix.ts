// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Gets the longest common prefix of an array of strings.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param strs The array of strings to find the common prefix for.
 * @returns The longest common prefix.
 *
 * @example Usage
 * ```ts
 * import { longestCommonPrefix } from "@std/text/unstable-longest-common-prefix";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(longestCommonPrefix(["flower", "flow", "flight"]), "fl");
 * ```
 */
export function longestCommonPrefix(strs: ArrayLike<string>): string {
  switch (strs.length) {
    case 0:
      return "";
    case 1:
      return strs[0]!;
    case 2:
      break;
    default:
      // sorting lexicographically ensures we only need to compare the first and last strings
      strs = Array.from(strs).sort();
  }

  const a = strs[0]!;
  const b = strs[strs.length - 1]!;
  const maxLength = Math.min(a.length, b.length);

  let end = 0;
  for (; end < maxLength; ++end) {
    if (a[end] !== b[end]) break;
  }

  // strip lone surrogates at end (unless both prefixes end with the same lone surrogate)
  if (end && [a, b].some((s) => s.codePointAt(end - 1)! > 0xffff)) --end;

  return a.slice(0, end);
}
