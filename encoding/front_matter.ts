// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license.
// https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js

import { parse } from "./yaml.ts";

const pattern = "^(" +
  "\\ufeff?" + // Maybe byte order mark
  "(= yaml =|---)" +
  "$([\\s\\S]*?)" +
  "^(?:\\2|\\.\\.\\.)\\s*" +
  "$" +
  (Deno.build.os === "windows" ? "\\r?" : "") +
  "(?:\\n)?)";
const regex = new RegExp(pattern, "m");

export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};

/**
 * Extracts front matter from a string.
 * @param str String to extract from.
 *
 * ```ts
 * import { extract } from "https://deno.land/std@$STD_VERSION/encoding/front_matter.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const { attrs, body, frontMatter } = extract<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\n");
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 * ```
 */
export function extract<T = unknown>(str: string): Extract<T> {
  const lines = str.split(/(\r?\n)/);
  if (/= yaml =|---/.test(lines[0])) {
    const match = regex.exec(str);
    if (!match) throw new TypeError("Unexpected end of input");
    const frontMatter = match.at(-1)?.replace(/^\s+|\s+$/g, "") || "";
    const attrs = parse(frontMatter) as T;
    const body = str.replace(match[0], "");
    return { frontMatter, body, attrs };
  }
  throw new TypeError("Failed to extract front matter");
}

/**
 * Tests if a string has valid front matter.
 * @param str String to test.
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/encoding/front_matter.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assert(test("---\ntitle: Three dashes marks the spot\n---\n"));
 * ```
 */
export function test(str: string): boolean {
  return regex.test(str);
}
