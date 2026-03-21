// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { extractFrontMatter } from "./_shared.ts";
import { parse, type ParseOptions } from "@std/yaml/parse";
import type { Extract } from "./types.ts";
import { EXTRACT_YAML_REGEXP } from "./_formats.ts";
import { test as _test } from "./test.ts";

export type { Extract };

/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Extract YAML front matter
 * ```ts
 * import { extract } from "@std/front-matter/unstable-yaml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---yaml
 * date: 2022-01-01
 * ---
 * Hello, world!`;
 * const result = extract(output, { schema: "json" });
 *
 * assertEquals(result, {
 *   frontMatter: "date: 2022-01-01",
 *   body: "Hello, world!",
 *   attrs: { date: "2022-01-01" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract YAML front matter from.
 * @param options The options to pass to `@std/yaml/parse`.
 * @returns The extracted YAML front matter and body content.
 */
export function extract<T>(text: string, options?: ParseOptions): Extract<T> {
  const { frontMatter, body } = extractFrontMatter(text, EXTRACT_YAML_REGEXP);
  const attrs = parse(frontMatter, options) as T;
  return { frontMatter, body, attrs };
}

/**
 * Tests if a string has valid YAML front matter.
 * Supports {@link https://yaml.org | YAML}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str String to test.
 * @returns `true` if the string has valid YAML front matter, otherwise `false`.
 *
 * @example Test for valid YAML front matter
 * ```ts
 * import { test } from "@std/front-matter/unstable-yaml";
 * import { assert } from "@std/assert";
 *
 * const result = test(
 * `---
 * title: Three dashes marks the spot
 * ---
 * `);
 * assert(result);
 * ```
 *
 * @example JSON front matter is not valid as YAML
 * ```ts
 * import { test } from "@std/front-matter/unstable-yaml";
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
  return _test(str, ["yaml"]);
}
