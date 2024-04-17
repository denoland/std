// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { EXTRACT_REGEXP_MAP } from "./_formats.ts";

export type Format = "yaml" | "toml" | "json" | "unknown";

/**
 * Tests if a string has valid front matter. Supports YAML, TOML and JSON.
 *
 * @param str String to test.
 * @param formats A list of formats to test for. Defaults to all supported formats.
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
 *
 * test("---\ntitle: Three dashes marks the spot\n---\n"); // true
 * test("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"); // true
 * test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"); // true
 * test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n", ["yaml"]); // false
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
