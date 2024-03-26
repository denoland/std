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

/** Options for {@linkcode escape}. */
export type EscapeOptions = { form: NormalizationForm };

/**
 * Escapes text for safe interpolation into HTML text content and quoted attributes.
 *
 * @example
 * ```ts
 * import { escape } from "https://deno.land/std@$STD_VERSION/html/entities.ts";
 *
 * escape("<>'&AA"); // "&lt;&gt;&#39;&amp;AA"
 *
 * // Characters that don't need to be escaped will be left alone,
 * // even if named HTML entities exist for them.
 * escape("þð"); // "þð"
 * // You can force non-ASCII chars to be escaped by setting the `form` option to `compatibility`:
 * escape("þð", { form: "compatibility" }); // "&#xfe;&#xf0;"
 * ```
 */
export function escape(
  str: string,
  options: Partial<EscapeOptions> = {},
): string {
  const escaped = str.replaceAll(rawRe, (m) => rawToEntity.get(m)!);
  return options.form === "compatibility"
    ? escapeAllNonAsciiPrintable(escaped)
    : escaped;
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
 * @example
 * ```ts
 * import { unescape } from "https://deno.land/std@$STD_VERSION/html/entities.ts";
 *
 * // Default options (only handles &<>'" and numeric entities)
 * unescape("&lt;&gt;&apos;&amp;&#65;&#x41;"); // "<>'&AA"
 * unescape("&thorn;&eth;"); // "&thorn;&eth;"
 *
 * // Using the full named entity list from the HTML spec (~47K un-minified)
 * import entityList from "https://deno.land/std@$STD_VERSION/html/named_entity_list.json" with { type: "json" };
 *
 * unescape("&thorn;&eth;", { entityList }); // "þð"
 * ```
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

/**
 * Normalization form to use for escaping. See {@linkcode normalize} for examples.
 *
 * - `readability`: Optimize for human readability and file size.
 * - `compatibility`: Optimize for compatibility across boundaries that lack
 *    full Unicode support, are unaware of encoding, or fail to respect
 *    encoding.
 */
export type NormalizationForm =
  | "readability"
  | "compatibility";

export type NormalizationOptions = {
  form: NormalizationForm;
};

/**
 * Normalize HTML or XML entities in a string of markup.
 *
 * @example
 * ```ts
 * normalize("&#x3e;"); // "&gt;"
 * normalize("&apos;"); // "&#39;"
 * normalize("&#x4e24;&#x53ea;&#x5c0f;&#x871c;&#x8702;"); // "两只小蜜蜂"
 *
 * // specifying a `form` option (default is `readability`):
 * normalize("两只小蜜蜂", { form: "readability" }); // "两只小蜜蜂"
 * normalize("两只小蜜蜂", { form: "compatibility" }); // "&#x4e24;&#x53ea;&#x5c0f;&#x871c;&#x8702;"
 * ```
 */
export function normalize(
  str: string,
  options: Partial<NormalizationOptions> = { form: "readability" },
) {
  return str
    .split(/([<>'"]+)/)
    .map((segment, i) => {
      return i % 2
        ? segment
        : escape(unescape(segment), { form: options.form });
    })
    .join("");
}

function escapeAllCharsAsHex(str: string) {
  return [...str].map((c) => `&#x${c.codePointAt(0)!.toString(16)};`).join("");
}

function escapeAllNonAsciiPrintable(str: string) {
  return str.replaceAll(
    // deno-lint-ignore no-control-regex
    /[\x00-\x08\x0b\x0c\x0e-\x1F\x7F-\u{10ffff}]+/gu,
    (m) => escapeAllCharsAsHex(m),
  );
}
