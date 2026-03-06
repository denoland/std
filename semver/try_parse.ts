// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { parse } from "./parse.ts";

/**
 * Returns the parsed SemVer, or `undefined` if it's not valid.
 *
 * @example Usage
 * ```ts
 * import { tryParse } from "@std/semver/try-parse";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(tryParse("1.2.3"), { major: 1, minor: 2, patch: 3, prerelease: [], build: [] });
 * assertEquals(tryParse("1.2.3-alpha"), { major: 1, minor: 2, patch: 3, prerelease: ["alpha"], build: [] });
 * assertEquals(tryParse("1.2.3+build"), { major: 1, minor: 2, patch: 3, prerelease: [], build: ["build"] });
 * assertEquals(tryParse("1.2.3-alpha.1+build.1"), { major: 1, minor: 2, patch: 3, prerelease: ["alpha", 1], build: ["build", "1"] });
 * assertEquals(tryParse(" invalid "), undefined);
 * ```
 *
 * @param value The version string to parse
 * @returns A valid SemVer or `undefined`
 */
export function tryParse(value: string): SemVer | undefined {
  try {
    return parse(value);
  } catch {
    return undefined;
  }
}
