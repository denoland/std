// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { EXTRACT_REGEXP_MAP, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";
import type { Format } from "./_types.ts";
import type { Extract, Extractor } from "./types.ts";

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

/**
 * Recognizes the format of the front matter in a string.
 * Supports {@link https://yaml.org | YAML}, {@link https://toml.io | TOML} and
 * {@link https://www.json.org/ | JSON}.
 *
 * @param str String to recognize.
 * @param formats A list of formats to recognize. Defaults to all supported formats.
 */
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
 * Factory that creates a function that extracts front matter from a string with
 * the given parsers. Supports {@link https://yaml.org | YAML},
 * {@link https://toml.io | TOML} and {@link https://www.json.org/ | JSON}.
 *
 * For simple use cases where you know which format to parse in advance, use the
 * pre-built extractors:
 *
 * - {@linkcode https://jsr.io/@std/front-matter/doc/yaml/~/extract | extractYaml}
 * - {@linkcode https://jsr.io/@std/front-matter/doc/toml/~/extract | extractToml}
 * - {@linkcode https://jsr.io/@std/front-matter/doc/json/~/extract | extractJson}
 *
 * @param formats A descriptor containing Format-parser pairs to use for each format.
 * @returns A function that extracts front matter from a string with the given parsers.
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
