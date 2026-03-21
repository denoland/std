// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { extractFrontMatter } from "./_shared.ts";
import { parse } from "@std/toml/parse";
import type { Extract } from "./types.ts";
import { EXTRACT_TOML_REGEXP } from "./_formats.ts";
import { test as _test } from "./test.ts";

export type { Extract };

/**
 * Extracts and parses {@link https://toml.io | TOML} from the metadata of
 * front matter content.
 *
 * @example Extract TOML front matter
 * ```ts
 * import { extract } from "@std/front-matter/toml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---toml
 * title = "Three dashes marks the spot"
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * assertEquals(result, {
 *   frontMatter: 'title = "Three dashes marks the spot"',
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract TOML front matter from.
 * @returns The extracted TOML front matter and body content.
 */
export function extract<T>(text: string): Extract<T> {
  const { frontMatter, body } = extractFrontMatter(text, EXTRACT_TOML_REGEXP);

  const attrs = (frontMatter ? parse(frontMatter) : {}) as T;
  return { frontMatter, body, attrs };
}

/**
 * Tests if a string has valid TOML front matter.
 * Supports {@link https://toml.io | TOML}.
 *
 * @param str String to test.
 * @returns `true` if the string has valid TOML front matter, otherwise `false`.
 *
 * @example Test for valid TOML front matter
 * ```ts
 * import { test } from "@std/front-matter/toml";
 * import { assert } from "@std/assert";
 *
 * const result = test(
 * `---toml
 * title = 'Three dashes followed by format marks the spot'
 * ---
 * `);
 * assert(result);
 * ```
 *
 * @example JSON front matter is not valid as TOML
 * ```ts
 * import { test } from "@std/front-matter/toml";
 * import { assertFalse } from "@std/assert";
 *
 * const result = test(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * `);
 * assertFalse(result);
 * ```
 */
export function test(str: string): boolean {
  return _test(str, ["toml"]);
}
