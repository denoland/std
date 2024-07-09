// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import { parse } from "@std/toml/parse";
import type { Extract } from "./types.ts";

export type { Extract };

const _extractor = createExtractor({
  ["toml"]: parse as Parser,
});

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
 * @deprecated (will be removed in 0.226.0) Use {@linkcode parseToml} instead.
 */
export function extract<T>(text: string): Extract<T> {
  return _extractor(text);
}
