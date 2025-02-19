// Copyright 2018-2025 the Deno authors. MIT license.

import { extract as extractToml } from "./toml.ts";
import { extract as extractYaml } from "./yaml.ts";
import { extract as extractJson } from "./json.ts";
import type { Extract } from "./types.ts";
import type { Format } from "./test.ts";
import { EXTRACT_REGEXP_MAP, RECOGNIZE_REGEXP_MAP } from "./_formats.ts";

export type { Extract };

/**
 * Recognizes the format of the front matter in a string.
 * Supports {@link https://yaml.org | YAML}, {@link https://toml.io | TOML} and
 * {@link https://www.json.org/ | JSON}.
 *
 * @param str String to recognize.
 * @param formats A list of formats to recognize. Defaults to all supported formats.
 */
function recognize(
  str: string,
  formats: Format[],
): Format {
  for (const format of formats) {
    if (RECOGNIZE_REGEXP_MAP.get(format)?.test(str)) return format;
  }
  throw new TypeError("Unsupported front matter format");
}

/**
 * Extracts and parses {@link https://yaml.org | YAML}, {@link https://toml.io |
 * TOML}, or {@link https://www.json.org/ | JSON} from the metadata of front
 * matter content, depending on the format.
 *
 * @example
 * ```ts
 * import { extract } from "@std/front-matter/any";
 *
 * const output = `---json
 * {
 *   "title": "Three dashes marks the spot"
 * }
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * result.frontMatter; // '{\n "title": "Three dashes marks the spot"\n}'
 * result.body; // "Hello, world!"
 * result.attrs; // { title: "Three dashes marks the spot" }
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract front matter from.
 * @returns The extracted front matter and body content.
 */
export function extract<T>(text: string): Extract<T> {
  const formats = [...EXTRACT_REGEXP_MAP.keys()] as Format[];
  const format = recognize(text, formats);
  switch (format) {
    case "yaml":
      return extractYaml<T>(text);
    case "toml":
      return extractToml<T>(text);
    case "json":
      return extractJson<T>(text);
  }
}
