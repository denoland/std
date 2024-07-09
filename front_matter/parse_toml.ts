// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import { parse } from "../toml/parse.ts";
import type { Extractor } from "./_types.ts";

/**
 * Parses {@link https://toml.io | TOML} from the metadata of
 * front matter content.
 *
 * @example Parse TOML front matter
 * ```ts
 * import { parseToml } from "@std/front-matter/parse-toml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---toml
 * title = "Three dashes marks the spot"
 * ---
 * Hello, world!`;
 * const result = parseToml(output);
 *
 * assertEquals(result, {
 *   frontMatter: 'title = "Three dashes marks the spot"',
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to parse TOML front matter from.
 * @returns The parsed TOML front matter and body content.
 */
export const parseToml: Extractor = createExtractor({
  ["toml"]: parse as Parser,
});
