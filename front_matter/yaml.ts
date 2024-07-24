// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { extractAndParse, type Parser } from "./_shared.ts";
import { parse } from "@std/yaml/parse";
import type { Extract } from "./types.ts";
import { EXTRACT_YAML_REGEXP } from "./_formats.ts";

export type { Extract };

/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @example Extract YAML front matter
 * ```ts
 * import { extract } from "@std/front-matter/yaml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---yaml
 * title: Three dashes marks the spot
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * assertEquals(result, {
 *   frontMatter: "title: Three dashes marks the spot",
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract YAML front matter from.
 * @returns The extracted YAML front matter and body content.
 */
export function extract<T>(text: string): Extract<T> {
  return extractAndParse(text, EXTRACT_YAML_REGEXP, parse as Parser);
}
