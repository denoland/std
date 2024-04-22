// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  type Extractor,
  type Parser,
} from "./create_extractor.ts";
import { parse } from "../toml/parse.ts";

/**
 * Extracts and parses {@link https://toml.io | TOML} from the metadata of
 * front matter content.
 *
 * @example
 * ```ts
 * import { extract } from "https://deno.land/std@$STD_VERSION/front_matter/toml.ts";
 *
 * const output = `---toml
 * title = "Three dashes marks the spot"
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * result.frontMatter; // 'title = "Three dashes marks the spot"'
 * result.body; // "Hello, world!"
 * result.attrs; // { title: "Three dashes marks the spot" }
 * ```
 */
export const extract: Extractor = createExtractor({
  ["toml"]: parse as Parser,
});
