// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import { parse } from "../yaml/parse.ts";
import type { Extractor } from "./_types.ts";

/**
 * Parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @example Parse YAML front matter
 * ```ts
 * import { parseYaml } from "@std/front-matter/parse-yaml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---yaml
 * title: Three dashes marks the spot
 * ---
 * Hello, world!`;
 * const result = parseYaml(output);
 *
 * assertEquals(result, {
 *   frontMatter: "title: Three dashes marks the spot",
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to parse YAML front matter from.
 * @returns The parsed YAML front matter and body content.
 */
export const parseYaml: Extractor = createExtractor({
  ["yaml"]: parse as Parser,
});
