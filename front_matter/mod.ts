// deno-lint-ignore-file no-unused-vars
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license

/**
 * Extracts
 * {@link https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/ | front matter}
 * from strings. Adapted from
 * {@link https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js | jxson/front-matter}.
 *
 * ## Supported formats
 *
 * ### JSON
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
 * import { extract } from "https://deno.land/std@$STD_VERSION/front_matter/json.ts";
 *
 * const str = "---json\n{\"and\": \"this\"}\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "{\"and\": \"this\"}"
 * result.body; // "deno is awesome"
 * result.attrs; // { and: "this" }
 * ```
 *
 * {@linkcode extractJson | extract} and {@linkcode test} support the following delimiters.
 *
 * ```markdown
 * ---json
 * {
 *   "and": "this"
 * }
 * ---
 * ```
 *
 * ```markdown
 * {
 *   "is": "JSON"
 * }
 * ```
 *
 * ### TOML
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
 * import { extract } from "https://deno.land/std@$STD_VERSION/front_matter/toml.ts";
 *
 * const str = "---toml\nmodule = 'front_matter'\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "module = 'front_matter'"
 * result.body; // "deno is awesome"
 * result.attrs; // { module: "front_matter" }
 * ```
 *
 * {@linkcode extractToml | extract} and {@linkcode test} support the following delimiters.
 *
 * ```markdown
 * ---toml
 * this = 'is'
 * ---
 * ```
 *
 * ```markdown
 * = toml =
 * parsed = 'as'
 * toml = 'data'
 * = toml =
 * ```
 *
 * ```markdown
 * +++
 * is = 'that'
 * not = 'cool?'
 * +++
 * ```
 *
 * ### YAML
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
 * import { extract } from "https://deno.land/std@$STD_VERSION/front_matter/yaml.ts";
 *
 * const str = "---yaml\nmodule: front_matter\n---\ndeno is awesome";
 * const result = extract(str);
 *
 * test(str); // true
 * result.frontMatter; // "module: front_matter"
 * result.body; // "deno is awesome"
 * result.attrs; // { module: "front_matter" }
 * ```
 *
 * {@linkcode extractYaml | extract} and {@linkcode test} support the following delimiters.
 *
 * ```front_matter
 * ---
 * these: are
 * ---
 * ```
 *
 * ```markdown
 * ---yaml
 * all: recognized
 * ---
 * ```
 *
 * ```markdown
 * = yaml =
 * as: yaml
 * = yaml =
 * ```
 *
 * @module
 */
import { extract as extractJson } from "./json.ts";
import { extract as extractToml } from "./toml.ts";
import { extract as extractYaml } from "./yaml.ts";

export * from "./create_extractor.ts";
export * from "./test.ts";
