// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import {
  Format,
  MAP_FORMAT_TO_EXTRACTOR_RX,
  MAP_FORMAT_TO_RECOGNIZER_RX,
} from "./formats.ts";

export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};

export type Extractor = <T = Record<string, unknown>>(
  str: string,
) => Extract<T>;

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

/**
 * Recognizes the format of the front matter in a string. Supports YAML, TOML and JSON.
 *
 * @param str String to recognize.
 * @param formats A list of formats to recognize. Defaults to all supported formats.
 *
 * ```ts
 * import { recognize, Format } from "https://deno.land/std@$STD_VERSION/front_matter/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 *
 * assertEquals(recognize("---\ntitle: Three dashes marks the spot\n---\n"), Format.YAML);
 * assertEquals(recognize("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"), Format.TOML);
 * assertEquals(recognize("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"), Format.JSON);
 * assertEquals(recognize("---xml\n<title>Three dashes marks the spot</title>\n---\n"), Format.UNKNOWN);
 *
 * assertEquals(recognize("---json\n<title>Three dashes marks the spot</title>\n---\n", [Format.YAML]), Format.UNKNOWN);
 */
function recognize(str: string, formats?: Format[]): Format {
  if (!formats) {
    formats = Object.keys(MAP_FORMAT_TO_RECOGNIZER_RX) as Format[];
  }

  const [firstLine] = str.split(/(\r?\n)/);

  for (const format of formats) {
    if (format === Format.UNKNOWN) {
      continue;
    }

    if (MAP_FORMAT_TO_RECOGNIZER_RX[format].test(firstLine)) {
      return format;
    }
  }

  return Format.UNKNOWN;
}

/**
 * Factory that creates a function that extracts front matter from a string with the given parsers.
 * Supports YAML, TOML and JSON.
 *
 * @param formats A descriptor containing Format-parser pairs to use for each format.
 * @returns A function that extracts front matter from a string with the given parsers.
 *
 * ```ts
 * import { createExtractor, Format, Parser } from "https://deno.land/std@$STD_VERSION/front_matter/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 * import { parse as parseYAML } from "https://deno.land/std@$STD_VERSION/yaml/parse.ts";
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
export function createExtractor(
  formats: Partial<Record<Format, Parser>>,
): Extractor {
  const formatKeys = Object.keys(formats) as Format[];

  return function extract<T>(str: string): Extract<T> {
    const format = recognize(str, formatKeys);
    const parser = formats[format];

    if (format === Format.UNKNOWN || !parser) {
      throw new TypeError(`Unsupported front matter format`);
    }

    return _extract(str, MAP_FORMAT_TO_EXTRACTOR_RX[format], parser);
  };
}
