// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Jason Campbell. MIT license.

/**
 * {@linkcode extract} and {@linkcode test} functions to handle many forms of
 * front matter.
 *
 * Adapted from
 * [jxson/front-matter](https://github.com/jxson/front-matter/blob/36f139ef797bd9e5196a9ede03ef481d7fbca18e/index.js).
 *
 * @module
 */

import { parse as parseYAML } from "./yaml.ts";
import { parse as parseTOML } from "./toml.ts";

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

type Delimiter = string | [begin: string, end: string];
type Parser<T> = (str: string) => T;

export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
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

  return [new RegExp(beginPattern + "$", "im"), new RegExp(pattern, "im")];
}

function _extract<T = unknown>(
  str: string,
  rx: RegExp,
  parse: Parser<T>,
): Extract<T> {
  const match = rx.exec(str);
  if (!match) throw new TypeError("Unexpected end of input");
  const frontMatter = match.at(-1)?.replace(/^\s+|\s+$/g, "") || "";
  const attrs = parse(frontMatter) as T;
  const body = str.replace(match[0], "");
  return { frontMatter, body, attrs };
}

/**
 * Extracts front matter from a string. Supports YAML, TOML and JSON.
 * @param str String to extract from.
 *
 * ```ts
 * import { extract } from "https://deno.land/std@$STD_VERSION/encoding/front_matter.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * let { attrs, body, frontMatter } = extract<{ title: string }>("---\ntitle: Three dashes marks the spot\n---\nferret");
 * assertEquals(attrs.title, "Three dashes marks the spot");
 * assertEquals(body, "ferret");
 * assertEquals(frontMatter, "title: Three dashes marks the spot");
 *
 * ({ attrs, body, frontMatter } = extract<{ title: string }>("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "");
 * assertEquals(frontMatter, "title = 'Three dashes followed by format marks the spot");
 *
 * ({ attrs, body, frontMatter } = extract<{ title: string }>("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\ngoat"));
 * assertEquals(attrs.title, "Three dashes followed by format marks the spot");
 * assertEquals(body, "goat");
 * assertEquals(frontMatter, "{\"title\": \"Three dashes followed by format marks the spot\"}");
 * ```
 */
export function extract<T = unknown>(str: string): Extract<T> {
  const lines = str.split(/(\r?\n)/);

  if (RX_RECOGNIZE_YAML.test(lines[0])) {
    return _extract<T>(str, RX_YAML, parseYAML as Parser<T>);
  } else if (RX_RECOGNIZE_TOML.test(lines[0])) {
    return _extract<T>(str, RX_TOML, parseTOML as Parser<T>);
  } else if (RX_RECOGNIZE_JSON.test(lines[0])) {
    return _extract<T>(str, RX_JSON, JSON.parse);
  }

  throw new TypeError("Failed to extract front matter");
}

/**
 * Tests if a string has valid front matter. Supports YAML, TOML and JSON.
 * @param str String to test.
 *
 * ```ts
 * import { test } from "https://deno.land/std@$STD_VERSION/encoding/front_matter.ts";
 * import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assert(test("---\ntitle: Three dashes marks the spot\n---\n"));
 * assert(test("---toml\ntitle = 'Three dashes followed by format marks the spot'\n---\n"));
 * assert(test("---json\n{\"title\": \"Three dashes followed by format marks the spot\"}\n---\n"));
 * ```
 */
export function test(str: string): boolean {
  return [RX_YAML, RX_TOML, RX_JSON].some((rx) => rx.test(str));
}
