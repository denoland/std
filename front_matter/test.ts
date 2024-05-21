// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { EXTRACT_REGEXP_MAP } from "./_formats.ts";

export type Format = "yaml" | "toml" | "json" | "unknown";

/**
 * Tests if a string has valid front matter.
 * Supports {@link https://yaml.org | YAML}, {@link https://toml.io | TOML} and
 * {@link https://www.json.org/ | JSON}.
 *
 * @param str String to test.
 * @param formats A list of formats to test for. Defaults to all supported formats.
 *
 * @example
 * ```ts
 * import { test } from "@std/front-matter/test";
 *
 * test(
 * `---
 * title: Three dashes marks the spot
 * ---
 * `); // true
 *
 * test(
 * `---toml
 * title = 'Three dashes followed by format marks the spot'
 * ---
 * `); // true
 *
 * test(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * `); // true
 *
 * test(
 * `---json
 * {"title": "Three dashes followed by format marks the spot"}
 * ---
 * `, ["yaml"]); // false
 * ```
 */
export function test(
  str: string,
  formats?: Format[],
): boolean {
  if (!formats) {
    formats = Object.keys(EXTRACT_REGEXP_MAP) as Format[];
  }

  for (const format of formats) {
    if (format === "unknown") {
      throw new TypeError("Unable to test for unknown front matter format");
    }

    const match = EXTRACT_REGEXP_MAP[format].exec(str);
    if (match?.index === 0) {
      return true;
    }
  }

  return false;
}
