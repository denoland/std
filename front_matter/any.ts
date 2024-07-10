// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { createExtractor, type Parser } from "./_create_extractor.ts";
import { parse as parseYaml } from "@std/yaml/parse";
import { parse as parseToml } from "@std/toml/parse";
import type { Extract } from "./types.ts";

export type { Extract };

const _extractor = createExtractor({
  yaml: parseYaml as Parser,
  toml: parseToml as Parser,
  json: JSON.parse as Parser,
});

/**
 * Extracts and parses {@link https://yaml.org | YAML}, {@link https://toml.io |
 * TOML}, or {@link https://www.json.org/ | JSON} from the metadata of front
 * matter content, depending on the format.
 *
 * @example
 * ```ts
 * import { extract } from "@std/front-matter/any";
 *
 * const output = `---json
 * {
 *   "title": "Three dashes marks the spot"
 * }
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * result.frontMatter; // '{\n "title": "Three dashes marks the spot"\n}'
 * result.body; // "Hello, world!"
 * result.attrs; // { title: "Three dashes marks the spot" }
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract front matter from.
 * @returns The extracted front matter and body content.
 */
export function extract<T>(text: string): Extract<T> {
  return _extractor(text);
}
