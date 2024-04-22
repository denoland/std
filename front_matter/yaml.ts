// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  type Extractor,
  type Parser,
} from "./create_extractor.ts";
import { parse } from "../yaml/parse.ts";

/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @example
 * ```ts
 * import { extract } from "https://deno.land/std@$STD_VERSION/front_matter/yaml.ts";
 *
 * const output = `---yaml
 * title: Three dashes marks the spot
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * result.frontMatter; // 'title: Three dashes marks the spot'
 * result.body; // "Hello, world!"
 * result.attrs; // { title: "Three dashes marks the spot" }
 * ```
 */
export const extract: Extractor = createExtractor({
  ["yaml"]: parse as Parser,
});
