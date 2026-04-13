// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { Range } from "./types.ts";
import { parseRange } from "./parse_range.ts";

/**
 * Parses the given range string and returns a Range object. If the range string
 * is invalid, `undefined` is returned.
 *
 * @example Usage
 * ```ts
 * import { tryParseRange } from "@std/semver";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(tryParseRange(">=1.2.3 <1.2.4"), [
 *  [
 *    { operator: ">=", major: 1, minor: 2, patch: 3, prerelease: [], build: [] },
 *    { operator: "<", major: 1, minor: 2, patch: 4, prerelease: [], build: [] },
 *  ],
 * ]);
 * ```
 *
 * @param value The range string
 * @returns A Range object if valid otherwise `undefined`
 */
export function tryParseRange(value: string): Range | undefined {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return parseRange(value);
  } catch {
    return undefined;
  }
}
