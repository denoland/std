// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { test as _test } from "./test.ts";

/**
 * Tests if a string has valid front matter.
 * Supports {@link https://www.json.org/ | JSON}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str String to test.
 * @returns `true` if the string has valid JSON front matter, otherwise `false`.
 *
 * @example Test for valid JSON front matter
 * ```ts
 * import { test } from "@std/front-matter/unstable-json";
 * import { assert } from "@std/assert";
 *
 * const result = test(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * `);
 * assert(result);
 * ```
 *
 * @example TOML front matter is not valid as JSON
 * ```ts
 * import { test } from "@std/front-matter/unstable-json";
 * import { assertFalse } from "@std/assert";
 *
 * const result = test(
 * `---toml
 * title = 'Three dashes followed by format marks the spot'
 * ---
 * `);
 * assertFalse(result);
 * ```
 */
export function test(str: string): boolean {
  return _test(str, ["json"]);
}
