// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license

/**
 * @deprecated (will be removed after 0.182.0) Import from `std/front_matter` instead.
 *
 * Extracts
 * [front matter](https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/)
 * from strings.
 *
 * {@linkcode createExtractor}, {@linkcode recognize} and {@linkcode test} functions
 * to handle many forms of front matter.
 *
 * Adapted from
 * [jxson/front-matter](https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js).
 *
 * Supported formats:
 *
 * - [`YAML`](./front_matter/yaml.ts)
 * - [`TOML`](./front_matter/toml.ts)
 * - [`JSON`](./front_matter/json.ts)
 *
 * ### Basic usage
 *
 * example.md
 *
 * ```markdown
 * ---
 * module: front_matter
 * tags:
 *   - yaml
 *   - toml
 *   - json
 * ---
 *
 * deno is awesome
 * ```
 *
 * example.ts
 *
 * ```ts
 * import {
 *   extract,
 *   test,
 * } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/any.ts";
 *
 * const str = await Deno.readTextFile("./example.md");
 *
 * if (test(str)) {
 *   console.log(extract(str));
 * } else {
 *   console.log("document doesn't contain front matter");
 * }
 * ```
 *
 * ```sh
 * $ deno run ./example.ts
 * {
 *   frontMatter: "module: front_matter\ntags:\n  - yaml\n  - toml\n  - json",
 *   body: "deno is awesome",
 *   attrs: { module: "front_matter", tags: [ "yaml", "toml", "json" ] }
 * }
 * ```
 *
 * The above example recognizes any of the supported formats, extracts metadata and
 * parses accordingly. Please note that in this case both the [YAML](#yaml) and
 * [TOML](#toml) parsers will be imported as dependencies.
 *
 * If you need only one specific format then you can import the file named
 * respectively from [here](./front_matter).
 *
 * ### Advanced usage
 *
 * ```ts
 * import {
 *   createExtractor,
 *   Format,
 *   Parser,
 *   test as _test,
 * } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/mod.ts";
 * import { parse } from "https://deno.land/std@$STD_VERSION/toml/parse.ts";
 *
 * const extract = createExtractor({
 *   [Format.TOML]: parse as Parser,
 *   [Format.JSON]: JSON.parse as Parser,
 * });
 *
 * export function test(str: string): boolean {
 *   return _test(str, [Format.TOML, Format.JSON]);
 * }
 * ```
 *
 * In this setup `extract()` and `test()` will work with TOML and JSON and only.
 * This way the YAML parser is not loaded if not needed. You can cherry-pick which
 * combination of formats are you supporting based on your needs.
 *
 * ### Delimiters
 *
 * #### YAML
 *
 * ```markdown
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
 * #### TOML
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
 * #### JSON
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
 * @module
 */

export {
  /**
   * @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead.
   *
   * Factory that creates a function that extracts front matter from a string with the given parsers.
   * Supports YAML, TOML and JSON.
   *
   * @param formats A descriptor containing Format-parser pairs to use for each format.
   * @returns A function that extracts front matter from a string with the given parsers.
   *
   * ```ts
   * import { createExtractor, Format, Parser } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/mod.ts";
   * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   * import { parse as parseYAML } from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";
   * import { parse as parseTOML } from "https://deno.land/std@$STD_VERSION/toml/parse.ts";
   * const extractYAML = createExtractor({ [Format.YAML]: parseYAML as Parser });
   * const extractTOML = createExtractor({ [Format.TOML]: parseTOML as Parser });
   * const extractJSON = createExtractor({ [Format.JSON]: JSON.parse as Parser });
   * const extractYAMLOrJSON = createExtractor({
   *     [Format.YAML]: parseYAML as Parser,
   *     [Format.JSON]: JSON.parse as Parser,
   * });
   *
   * let { attrs, body, frontMatter } = extractYAML<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\nferret");
   * assertEquals(attrs.title, "Three dashes marks the spot");
   * assertEquals(body, "ferret");
   * assertEquals(frontMatter, "title: Three dashes marks the spot");
   *
   * ({ attrs, body, frontMatter } = extractTOML<{ title: string }>("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"));
   * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
   * assertEquals(body, "");
   * assertEquals(frontMatter, "title = 'Three dashes followed by format marks the spot'");
   *
   * ({ attrs, body, frontMatter } = extractJSON<{ title: string }>("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\ngoat"));
   * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
   * assertEquals(body, "goat");
   * assertEquals(frontMatter, "{\"title\": \"Three dashes followed by format marks the spot\"}");
   *
   * ({ attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\nferret"));
   * assertEquals(attrs.title, "Three dashes marks the spot");
   * assertEquals(body, "ferret");
   * assertEquals(frontMatter, "title: Three dashes marks the spot");
   *
   * ({ attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\ngoat"));
   * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
   * assertEquals(body, "goat");
   * assertEquals(frontMatter, "{\"title\": \"Three dashes followed by format marks the spot\"}");
   * ```
   */
  createExtractor,
  /** @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead. */
  type Extract,
  /** @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead. */
  type Extractor,
  /** @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead. */
  Format,
  /** @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead. */
  type Parser,
  /**
   * @deprecated (will be removed after 0.182.0) Import from `std/front_matter/mod.ts` instead.
   *
   * Tests if a string has valid front matter. Supports YAML, TOML and JSON.
   *
   * @param str String to test.
   * @param formats A list of formats to test for. Defaults to all supported formats.
   *
   * ```ts
   * import { test, Format } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/mod.ts";
   * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
   *
   * assert(test("---\ntitle: Three dashes marks the spot\n---\n"));
   * assert(test("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"));
   * assert(test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"));
   *
   * assert(!test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n", [Format.YAML]));
   * ```
   */
  test,
} from "../../front_matter/mod.ts";
