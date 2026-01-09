// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal module for XML entity encoding and decoding.
 *
 * @module
 */

/**
 * The five predefined XML entities per XML 1.0 §4.6.
 * Using const assertion for precise typing.
 */
const NAMED_ENTITIES = {
  lt: "<",
  gt: ">",
  amp: "&",
  apos: "'",
  quot: '"',
} as const;

/**
 * Reverse mapping for encoding special characters.
 */
const CHAR_TO_ENTITY = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
} as const;

/**
 * Extended mapping for attribute value encoding (includes whitespace).
 */
const ATTR_CHAR_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
  "\t": "&#9;",
  "\n": "&#10;",
  "\r": "&#13;",
};

// Hoisted regex patterns for performance
const ENTITY_RE = /&([a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g;
const SPECIAL_CHARS_RE = /[<>&'"]/g;
const ATTR_ENCODE_RE = /[<>&'"\t\n\r]/g;

/**
 * Pattern to detect bare `&` not followed by a valid reference.
 * Valid references are: &name; or &#digits; or &#xhexdigits;
 */
const BARE_AMPERSAND_RE = /&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/;

/**
 * Checks if a code point is a valid XML 1.0 Char per §2.2.
 *
 * Per the specification:
 *   Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 *
 * This excludes:
 * - NULL (#x0)
 * - Control characters #x1-#x8, #xB-#xC, #xE-#x1F
 * - Surrogate pairs #xD800-#xDFFF (handled separately)
 * - Non-characters #xFFFE-#xFFFF
 *
 * @see {@link https://www.w3.org/TR/xml/#charsets | XML 1.0 §2.2 Characters}
 */
function isValidXmlChar(codePoint: number): boolean {
  return (
    codePoint === 0x9 ||
    codePoint === 0xA ||
    codePoint === 0xD ||
    (codePoint >= 0x20 && codePoint <= 0xD7FF) ||
    (codePoint >= 0xE000 && codePoint <= 0xFFFD) ||
    (codePoint >= 0x10000 && codePoint <= 0x10FFFF)
  );
}

/**
 * Options for entity decoding.
 */
export interface DecodeEntityOptions {
  /**
   * If true, throws an error on invalid bare `&` characters.
   * Per XML 1.0 §3.1, `&` must be escaped as `&amp;` unless it starts
   * a valid entity or character reference.
   *
   * @default false
   */
  readonly strict?: boolean;
}

/**
 * Decodes XML entities in a string.
 *
 * Handles the five predefined entities (§4.6) and numeric character
 * references (§4.1) per the XML 1.0 specification.
 *
 * @param text The text containing XML entities to decode.
 * @param options Decoding options.
 * @returns The text with entities decoded.
 */
export function decodeEntities(
  text: string,
  options?: DecodeEntityOptions,
): string {
  // Fast path: no ampersand means no entities to decode
  if (!text.includes("&")) return text;

  if (options?.strict) {
    const match = BARE_AMPERSAND_RE.exec(text);
    if (match) {
      throw new Error(
        `Invalid bare '&' at position ${match.index}: ` +
          `entity references must be &name; or &#num; or &#xHex;`,
      );
    }
  }

  return text.replace(ENTITY_RE, (match, entity: string) => {
    if (entity.startsWith("#x")) {
      // Hexadecimal character reference
      const codePoint = parseInt(entity.slice(2), 16);
      // Invalid per XML 1.0 §4.1 WFC: Legal Character - must match Char production
      if (!isValidXmlChar(codePoint)) {
        return match;
      }
      return String.fromCodePoint(codePoint);
    }
    if (entity.startsWith("#")) {
      // Decimal character reference
      const codePoint = parseInt(entity.slice(1), 10);
      // Invalid per XML 1.0 §4.1 WFC: Legal Character - must match Char production
      if (!isValidXmlChar(codePoint)) {
        return match;
      }
      return String.fromCodePoint(codePoint);
    }
    // Named entity
    if (entity in NAMED_ENTITIES) {
      return NAMED_ENTITIES[entity as keyof typeof NAMED_ENTITIES];
    }
    // Unknown entity - return as-is
    return match;
  });
}

/**
 * Encodes special characters as XML entities.
 *
 * @param text The text to encode.
 * @returns The text with special characters encoded as entities.
 */
export function encodeEntities(text: string): string {
  // Fast path: no special characters means nothing to encode
  if (!/[<>&'"]/.test(text)) return text;
  return text.replace(
    SPECIAL_CHARS_RE,
    (char) => CHAR_TO_ENTITY[char as keyof typeof CHAR_TO_ENTITY],
  );
}

/**
 * Encodes special characters for use in XML attribute values.
 * Encodes whitespace characters that would be normalized per XML 1.0 §3.3.3.
 *
 * @param value The attribute value to encode.
 * @returns The encoded attribute value.
 */
export function encodeAttributeValue(value: string): string {
  // Fast path: no special characters means nothing to encode
  if (!/[<>&'"\t\n\r]/.test(value)) return value;
  return value.replace(ATTR_ENCODE_RE, (c) => ATTR_CHAR_MAP[c]!);
}
