// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license

/**
 * {@linkcode createExtractor}, {@linkcode recognize} and {@linkcode test} functions
 * to handle many forms of front matter.
 *
 * Adapted from
 * [jxson/front-matter](https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js).
 *
 * @module
 */

type Delimiter = string | [begin: string, end: string];
export type Parser = <T = Record<string, unknown>>(str: string) => T;
export type Extractor = <T = Record<string, unknown>>(
  str: string,
) => Extract<T>;

export enum Format {
  YAML = "yaml",
  TOML = "toml",
  JSON = "json",
  UNKNOWN = "unknown",
}

export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};

const { isArray } = Array;
const [RX_RECOGNIZE_YAML, RX_YAML] = createRegExp(
  ["---yaml", "---"],
  "= yaml =",
  "---",
);
const [RX_RECOGNIZE_TOML, RX_TOML] = createRegExp(
  ["---toml", "---"],
  "= toml =",
);
const [RX_RECOGNIZE_JSON, RX_JSON] = createRegExp(
  ["---json", "---"],
  "= json =",
);
const formatToRecognizerRx: Omit<Record<Format, RegExp>, Format.UNKNOWN> = {
  [Format.YAML]: RX_RECOGNIZE_YAML,
  [Format.TOML]: RX_RECOGNIZE_TOML,
  [Format.JSON]: RX_RECOGNIZE_JSON,
};
const formatToExtractorRx: Omit<Record<Format, RegExp>, Format.UNKNOWN> = {
  [Format.YAML]: RX_YAML,
  [Format.TOML]: RX_TOML,
  [Format.JSON]: RX_JSON,
};

function getBeginToken(delimiter: Delimiter): string {
  return isArray(delimiter) ? delimiter[0] : delimiter;
}

function getEndToken(delimiter: Delimiter): string {
  return isArray(delimiter) ? delimiter[1] : delimiter;
}

function createRegExp(...dv: Delimiter[]): [RegExp, RegExp] {
  const beginPattern = "(" + dv.map(getBeginToken).join("|") + ")";
  const pattern = "^(" +
    "\\ufeff?" + // Maybe byte order mark
    beginPattern +
    "$([\\s\\S]+?)" +
    "^(?:" + dv.map(getEndToken).join("|") + ")\\s*" +
    "$" +
    (Deno.build.os === "windows" ? "\\r?" : "") +
    "(?:\\n)?)";

  return [
    new RegExp("^" + beginPattern + "$", "im"),
    new RegExp(pattern, "im"),
  ];
}

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
 * import { parse as parseTOML } from "https://deno.land/std@$STD_VERSION/encoding/toml.ts";
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
  return function extract<T>(str: string): Extract<T> {
    const format = recognize(str, Object.keys(formats) as Format[]);
    const parser = formats[format];

    if (format === Format.UNKNOWN || !parser) {
      throw new TypeError(`Unsupported front matter format`);
    }

    return _extract(str, formatToExtractorRx[format], parser);
  };
}

/**
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
export function test(str: string, formats?: Format[]): boolean {
  if (!formats) {
    formats = Object.keys(formatToExtractorRx) as Format[];
  }

  for (const format of formats) {
    if (format === Format.UNKNOWN) {
      throw new TypeError("Unable to test for unknown front matter format");
    }

    const match = formatToExtractorRx[format].exec(str);
    if (match?.index === 0) {
      return true;
    }
  }

  return false;
}

/**
 * Recognizes the format of the front matter in a string. Supports YAML, TOML and JSON.
 *
 * @param str String to recognize.
 * @param formats A list of formats to recognize. Defaults to all supported formats.
 *
 * ```ts
 * import { recognize, Format } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(recognize("---\ntitle: Three dashes marks the spot\n---\n"), Format.YAML);
 * assertEquals(recognize("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"), Format.TOML);
 * assertEquals(recognize("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"), Format.JSON);
 * assertEquals(recognize("---xml\n<title>Three dashes marks the spot</title>\n---\n"), Format.UNKNOWN);
 *
 * assertEquals(recognize("---json\n<title>Three dashes marks the spot</title>\n---\n", [Format.YAML]), Format.UNKNOWN);
 */
export function recognize(str: string, formats?: Format[]): Format {
  if (!formats) {
    formats = Object.keys(formatToRecognizerRx) as Format[];
  }

  const [firstLine] = str.split(/(\r?\n)/);

  for (const format of formats) {
    if (format === Format.UNKNOWN) {
      continue;
    }

    if (formatToRecognizerRx[format].test(firstLine)) {
      return format;
    }
  }

  return Format.UNKNOWN;
}
