// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Object structure for a list of HTML entities. */
export type EntityList = Record<string, string>;

const rawToEntityEntries = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
] as const;

const defaultEntityList: EntityList = Object.fromEntries([
  ...rawToEntityEntries.map(([raw, entity]) => [entity, raw]),
  ["&apos;", "'"],
  ["&nbsp;", "\xa0"],
]);

const rawToEntity = new Map<string, string>(rawToEntityEntries);

const rawRe = new RegExp(`[${[...rawToEntity.keys()].join("")}]`, "g");

/**
 * Escapes text for safe interpolation into HTML text content and quoted attributes.
 *
 * @example Usage
 * ```ts
 * import { escape } from "@std/html/entities";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(escape("<>'&AA"), "&lt;&gt;&#39;&amp;AA");
 *
 * // Characters that don't need to be escaped will be left alone,
 * // even if named HTML entities exist for them.
 * assertEquals(escape("þð"), "þð");
 * ```
 *
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escape(str: string): string {
  return str.replaceAll(rawRe, (m) => rawToEntity.get(m)!);
}

/** Options for {@linkcode unescape}. */
export type UnescapeOptions = { entityList: EntityList };

const defaultUnescapeOptions: UnescapeOptions = {
  entityList: defaultEntityList,
};

const MAX_CODE_POINT = 0x10ffff;

const RX_DEC_ENTITY = /&#([0-9]+);/g;
const RX_HEX_ENTITY = /&#x(\p{AHex}+);/gu;

const entityListRegexCache = new WeakMap<EntityList, RegExp>();

/**
 * Unescapes HTML entities in text.
 *
 * Default options only handle `&<>'"` and numeric entities.
 *
 * @example Basic usage
 * ```ts
 * import { unescape } from "@std/html/entities";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescape("&lt;&gt;&#39;&amp;AA"), "<>'&AA");
 * assertEquals(unescape("&thorn;&eth;"), "&thorn;&eth;");
 * ```
 *
 * @example Using a custom entity list
 *
 * This uses the full named entity list from the HTML spec (~47K un-minified)
 *
 * ```ts
 * import { unescape } from "@std/html/entities";
 * import entityList from "@std/html/named-entity-list.json" with { type: "json" };
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescape("&lt;&gt;&#39;&amp;AA", { entityList }), "<>'&AA");
 * ```
 *
 * @param str The string to unescape.
 * @param options Options for unescaping.
 * @returns The unescaped string.
 */
export function unescape(
  str: string,
  options: Partial<UnescapeOptions> = {},
): string {
  const { entityList } = { ...defaultUnescapeOptions, ...options };

  let entityRe = entityListRegexCache.get(entityList);

  if (!entityRe) {
    entityRe = new RegExp(
      `(${
        Object.keys(entityList)
          .sort((a, b) => b.length - a.length)
          .join("|")
      })`,
      "g",
    );

    entityListRegexCache.set(entityList, entityRe);
  }

  return str
    .replaceAll(entityRe, (m) => entityList[m]!)
    .replaceAll(RX_DEC_ENTITY, (_, dec) => codePointStrToChar(dec, 10))
    .replaceAll(RX_HEX_ENTITY, (_, hex) => codePointStrToChar(hex, 16));
}

function codePointStrToChar(codePointStr: string, radix: number) {
  const codePoint = parseInt(codePointStr, radix);

  return codePoint > MAX_CODE_POINT ? "�" : String.fromCodePoint(codePoint);
}
