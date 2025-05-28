// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

const FORBIDDEN_CUSTOM_ELEMENT_NAMES: string[] = [
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
] as const;

const CUSTOM_ELEMENT_NAME_CHARS =
  /^[a-z](?:[-.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]|[\u{10000}-\u{EFFFF}])*-(?:[-.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF]|[\u{10000}-\u{EFFFF}])*$/u;

/**
 * Returns whether the given string is a valid custom element name, as per the
 * requirements defined in
 * {@link https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * The element name must not be any of the following:
 * - `annotation-xml`
 * - `color-profile`
 * - `font-face`
 * - `font-face-src`
 * - `font-face-uri`
 * - `font-face-format`
 * - `font-face-name`
 * - `missing-glyph`
 *
 * @example Usage
 *
 * Using a valid custom element name
 *
 * ```ts
 * import { isValidCustomElementName } from "@std/html/unstable-is-valid-custom-element-name";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(isValidCustomElementName("custom-element"), true);
 * assertEquals(isValidCustomElementName("font-face"), false);
 * assertEquals(isValidCustomElementName("custom-element@"), false);
 * ```
 *
 * @param elementName The element name to be validate
 * @returns `true` if the element name is valid, `false` otherwise.
 */
export function isValidCustomElementName(elementName: string): boolean {
  return !FORBIDDEN_CUSTOM_ELEMENT_NAMES.includes(elementName) &&
    CUSTOM_ELEMENT_NAME_CHARS.test(elementName);
}
