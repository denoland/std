// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { extractFrontMatter } from "./_shared.ts";
import { EXTRACT_JSON_REGEXP } from "./_formats.ts";
import type { Extract } from "./types.ts";
import { test as _test } from "./test.ts";

export type { Extract };

/**
 * Extracts and parses {@link https://www.json.org/ | JSON } from the metadata
 * of front matter content.
 *
 * @example Extract JSON front matter
 * ```ts
 * import { extract } from "@std/front-matter/json";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---json
 * { "title": "Three dashes marks the spot" }
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * assertEquals(result, {
 *   frontMatter: '{ "title": "Three dashes marks the spot" }',
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract JSON front matter from.
 * @returns The extracted JSON front matter and body content.
 */
export function extract<T>(text: string): Extract<T> {
  const { frontMatter, body } = extractFrontMatter(text, EXTRACT_JSON_REGEXP);
  const attrs = (frontMatter ? JSON.parse(frontMatter) : {}) as T;
  return { frontMatter, body, attrs };
}

/**
 * Tests if a string has valid front matter.
 * Supports {@link https://www.json.org/ | JSON}.
 *
 * @param str String to test.
 * @returns `true` if the string has valid JSON front matter, otherwise `false`.
 *
 * @example Test for valid JSON front matter
 * ```ts
 * import { test } from "@std/front-matter/json";
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
 * import { test } from "@std/front-matter/json";
 * import { assert } from "@std/assert";
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
