// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import type { Extractor } from "./_types.ts";

/**
 * Parses {@link https://www.json.org/ | JSON } from the metadata
 * of front matter content.
 *
 * @example Parse JSON front matter
 * ```ts
 * import { parse } from "@std/front-matter/parse-json";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---json
 * { "title": "Three dashes marks the spot" }
 * ---
 * Hello, world!`;
 * const result = parse(output);
 *
 * assertEquals(result, {
 *   frontMatter: '{ "title": "Three dashes marks the spot" }',
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to parse JSON front matter from.
 * @returns The parsed JSON front matter and body content.
 */
export const parseJson: Extractor = createExtractor({
  json: JSON.parse as Parser,
});
