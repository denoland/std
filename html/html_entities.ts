// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

export type EntityList = Record<string, { characters: string }>;
export type DecodeHtmlEntitiesOptions = { entityList: EntityList };

const rawToEntityEntries = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
] as const;

const defaultEntityList: EntityList = Object.fromEntries([
  ...rawToEntityEntries.map(([characters, entity]) => [entity, { characters }]),
  ["&apos;", { characters: "'" }],
]);

const rawToEntity = new Map<string, string>(rawToEntityEntries);

const rawRe = new RegExp(`[${[...rawToEntity.keys()].join("")}]`, "g");

/**
 * Encodes HTML entities for safe interpolation into HTML
 *
 * @example
 * ```ts
 * import { encodeHtmlEntities } from "https://deno.land/std@$STD_VERSION/html/html_entities.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * assertEquals(encodeHtmlEntities("<>'&AA"), "&lt;&gt;&#39;&amp;AA");
 *
 * // characters that don't need to be encoded will be left alone,
 * // even if named HTML entities exist for them
 * assertEquals(encodeHtmlEntities("þð"), "þð");
 * ```
 */
export function encodeHtmlEntities(str: string) {
  return str.replaceAll(rawRe, (m) => rawToEntity.get(m)!);
}

const defaultDecodeHtmlEntitiesOptions: DecodeHtmlEntitiesOptions = {
  entityList: defaultEntityList,
};

const MAX_CODE_POINT = 0x10ffff;

const RX_HEX_ENTITY = /&#x(\p{AHex}+);/gu;
const RX_DEC_ENTITY = /&#([0-9]+);/g;

const entityListRegexCache = new WeakMap<EntityList, RegExp>();

/**
 * Decodes HTML entities
 *
 * @example
 * ```ts
 * import { decodeHtmlEntities } from "https://deno.land/std@$STD_VERSION/html/html_entities.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * // default options (only handles &<>'" and numeric entities)
 * assertEquals(decodeHtmlEntities("&lt;&gt;&apos;&amp;&#65;&#x41;"), "<>'&AA");
 * assertEquals(decodeHtmlEntities("&thorn;&eth;"), "&thorn;&eth;");
 *
 * // using the full named entity list from the HTML spec (~145KB unminified)
 * import entityList from "https://html.spec.whatwg.org/entities.json" assert { type: "json" };
 * assertEquals(decodeHtmlEntities("&thorn;&eth;", { entityList }), "þð");
 * ```
 */
export function decodeHtmlEntities(
  str: string,
  options: Partial<DecodeHtmlEntitiesOptions> = {},
) {
  const { entityList } = { ...defaultDecodeHtmlEntitiesOptions, ...options };

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
    .replaceAll(entityRe, (m) => entityList[m]!.characters)
    .replaceAll(RX_DEC_ENTITY, (_, dec) => codePointStrToChar(dec, 10))
    .replaceAll(RX_HEX_ENTITY, (_, hex) => codePointStrToChar(hex, 16));
}

function codePointStrToChar(codePointStr: string, radix: number) {
  const codePoint = parseInt(codePointStr, radix);

  return codePoint > MAX_CODE_POINT ? "�" : String.fromCodePoint(codePoint);
}
