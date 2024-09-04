// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { type Format, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";
import type { Extract } from "./types.ts";

/** Parser function type */
export type Parser = <T = Record<string, unknown>>(str: string) => T;

export function extractAndParse<T>(
  input: string,
  extractRegExp: RegExp,
  parse: Parser,
): Extract<T> {
  const match = extractRegExp.exec(input);
  if (!match || match.index !== 0) {
    throw new TypeError("Unexpected end of input");
  }
  const frontMatter = match.at(-1)?.replace(/^\s+|\s+$/g, "") ?? "";
  const attrs = parse(frontMatter) as T;
  const body = input.replace(match[0], "");
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
  const [firstLine] = str.split(/(\r?\n)/) as [string];

  for (const format of formats) {
    if (RECOGNIZE_REGEXP_MAP.get(format)?.test(firstLine)) return format;
  }

  throw new TypeError("Unsupported front matter format");
}
