// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  type Extractor,
  type Parser,
} from "./create_extractor.ts";
import { parse } from "@std/yaml/parse";

/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @example Extract YAML front matter
 * ```ts
 * import { extract } from "@std/front-matter/yaml";
 * import { assertEquals } from "@std/assert/assert-equals";
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
 */
export const extract: Extractor = createExtractor({
  ["yaml"]: parse as Parser,
});
