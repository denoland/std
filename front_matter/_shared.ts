// Copyright 2018-2025 the Deno authors. MIT license.

import { type Format, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";
import type { Extract } from "./types.ts";

/** Parser function type */
export type Parser = <T = Record<string, unknown>>(str: string) => T;

export function extractAndParse<T>(
  input: string,
  extractRegExp: RegExp,
  parse: Parser,
): Extract<T> {
  const groups = extractRegExp.exec(input)?.groups;
  if (!groups) throw new TypeError("Unexpected end of input");
  const { data = "", body = "" } = groups;
  const frontMatter = data;
  const attrs = parse(frontMatter) as T;
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
export function recognize(
  str: string,
  formats: Format[],
): Format {
  for (const format of formats) {
    if (RECOGNIZE_REGEXP_MAP.get(format)?.test(str)) return format;
  }
  throw new TypeError("Unsupported front matter format");
}
