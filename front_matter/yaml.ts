// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { extractAndParse } from "./_shared.ts";
import { parse, type ParseOptions } from "@std/yaml/parse";
import type { Extract } from "./types.ts";
import { EXTRACT_YAML_REGEXP } from "./_formats.ts";

export type { Extract };

/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @example Extract YAML front matter
 * ```ts
 * import { extract } from "@std/front-matter/yaml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---yaml
 * title: Three dashes marks the spot
 * ---
 * Hello, world!`;
 * const result = extract(output);
 *
 * assertEquals(result, {
 *   frontMatter: "title: Three dashes marks the spot",
 *   body: "Hello, world!",
 *   attrs: { title: "Three dashes marks the spot" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract YAML front matter from.
 * @returns The extracted YAML front matter and body content.
 */
export function extract<
  T extends unknown[] | Record<string, unknown> | string | null,
>(
  text: string,
): Extract<T>;
/**
 * Extracts and parses {@link https://yaml.org | YAML} from the metadata of
 * front matter content.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Extract YAML front matter
 * ```ts
 * import { extract } from "@std/front-matter/yaml";
 * import { assertEquals } from "@std/assert";
 *
 * const output = `---yaml
 * date: 2022-01-01
 * ---
 * Hello, world!`;
 * const result = extract(output, { schema: "json" });
 *
 * assertEquals(result, {
 *   frontMatter: "date: 2022-01-01",
 *   body: "Hello, world!",
 *   attrs: { date: "2022-01-01" },
 * });
 * ```
 *
 * @typeParam T The type of the parsed front matter.
 * @param text The text to extract YAML front matter from.
 * @param options The options to pass to `@std/yaml/parse`.
 * @returns The extracted YAML front matter and body content.
 */
export function extract<T extends Record<string, unknown>>(
  text: string,
  options?: ParseOptions,
): Extract<T>;
export function extract<T extends Record<string, unknown>>(
  text: string,
  options?: ParseOptions,
): Extract<T> {
  return extractAndParse<T>(
    text,
    EXTRACT_YAML_REGEXP,
    (s) => parse(s, options),
  );
}
