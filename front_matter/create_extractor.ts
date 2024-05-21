// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { EXTRACT_REGEXP_MAP, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";
import type { Format } from "./test.ts";

/** Return type for {@linkcode Extractor}. */
export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};

/** Function return type for {@linkcode createExtractor}. */
export type Extractor = <T = Record<string, unknown>>(
  str: string,
) => Extract<T>;

/** Parser function type used alongside {@linkcode createExtractor}. */
export type Parser = <T = Record<string, unknown>>(str: string) => T;

function _extract<T>(
  str: string,
  rx: RegExp,
  parse: Parser,
): Extract<T> {
  const match = rx.exec(str);
  if (!match || match.index !== 0) {
    throw new TypeError("Unexpected end of input");
  }
  const frontMatter = match.at(-1)?.replace(/^\s+|\s+$/g, "") || "";
  const attrs = parse(frontMatter) as T;
  const body = str.replace(match[0], "");
  return { frontMatter, body, attrs };
}

function recognize(str: string, formats?: Format[]): Format {
  if (!formats) {
    formats = Object.keys(RECOGNIZE_REGEXP_MAP) as Format[];
  }

  const [firstLine] = str.split(/(\r?\n)/) as [string];

  for (const format of formats) {
    if (format === "unknown") {
      continue;
    }

    if (RECOGNIZE_REGEXP_MAP[format].test(firstLine)) {
      return format;
    }
  }

  return "unknown";
}

/**
 * Factory that creates a function that extracts front matter from a string with the given parsers.
 * Supports {@link https://yaml.org | YAML}, {@link https://toml.io | TOML} and
 * {@link https://www.json.org/ | JSON}.
 *
 * @param formats A descriptor containing Format-parser pairs to use for each format.
 * @returns A function that extracts front matter from a string with the given parsers.
 *
 * @example
 * ```ts
 * import { createExtractor, Parser } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 * import { parse as parseYAML } from "@std/yaml/parse";
 *
 * const extractYAML = createExtractor({ yaml: parseYAML as Parser });
 * const { attrs, body, frontMatter } = extractYAML<{ title: string }>(
 * `---
 * title: Three dashes marks the spot
 * ---
 * ferret`);
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "ferret");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 * ```
 *
 * @example
 * ```ts
 * import { createExtractor, Parser } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 * import { parse as parseTOML } from "@std/toml/parse";
 *
 * const extractTOML = createExtractor({ toml: parseTOML as Parser });
 * const { attrs, body, frontMatter } = extractTOML<{ title: string }>(
 * `---toml
 * title = 'Three dashes followed by format marks the spot'
 * ---
 * `);
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "");
 * assertEquals(frontMatter, "title = 'Three dashes followed by format marks the spot'");
 * ```
 *
 * @example
 * ```ts
 * import { createExtractor, Parser } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const extractJSON = createExtractor({ json: JSON.parse as Parser });
 * const { attrs, body, frontMatter } = extractJSON<{ title: string }>(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * goat`);
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "goat");
 * assertEquals(frontMatter, `{"title": "Three dashes followed by format marks the spot"}`);
 * ```
 *
 * @example
 * ```ts
 * import { createExtractor, Parser } from "@std/front-matter";
 * import { assertEquals } from "@std/assert/assert-equals";
 * import { parse as parseYAML } from "@std/yaml/parse";
 *
 * const extractYAMLOrJSON = createExtractor({
 *   yaml: parseYAML as Parser,
 *   json: JSON.parse as Parser,
 * });
 *
 * let { attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>(
 * `---
 * title: Three dashes marks the spot
 * ---
 * ferret`);
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "ferret");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 *
 * ({ attrs, body, frontMatter } = extractYAMLOrJSON<{ title: string }>(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * goat`));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "goat");
 * assertEquals(frontMatter, `{"title": "Three dashes followed by format marks the spot"}`);
 * ```
 */
export function createExtractor(
  formats: Partial<Record<Format, Parser>>,
): Extractor {
  const formatKeys = Object.keys(formats) as Format[];

  return function extract<T>(str: string): Extract<T> {
    const format = recognize(str, formatKeys);
    const parser = formats[format];

    if (format === "unknown" || !parser) {
      throw new TypeError(`Unsupported front matter format`);
    }

    return _extract(str, EXTRACT_REGEXP_MAP[format], parser);
  };
}
