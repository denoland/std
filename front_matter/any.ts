// Copyright 2018-2025 the Deno authors. MIT license.

import { extract as extractToml } from "./toml.ts";
import { extract as extractYaml } from "./yaml.ts";
import { extract as extractJson } from "./json.ts";
import type { Extract } from "./types.ts";
import { RECOGNIZE_REGEXP_MAP } from "./_formats.ts";

export type { Extract };

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
export function extract<T extends Record<string, unknown>>(
  text: string,
): Extract<T> {
  const format = [...RECOGNIZE_REGEXP_MAP.entries()]
    .find(([_, regexp]) => regexp.test(text))?.[0];
  switch (format) {
    case "yaml":
      return extractYaml<T>(text);
    case "toml":
      return extractToml<T>(text);
    case "json":
      return extractJson<T>(text);
    default:
      throw new TypeError("Unsupported front matter format");
  }
}
