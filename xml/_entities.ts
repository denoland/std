// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal module for XML entity encoding and decoding.
 *
 * @module
 */

// Hoisted regex patterns for performance
const ENTITY_RE = /&([a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g;
const SPECIAL_CHARS_RE = /[<>&'"]/g;
const ATTR_ENCODE_RE = /[<>&'"\t\n\r]/g;

/**
 * Pattern to detect bare `&` not followed by a valid reference.
 * Valid references are: &name; or &#digits; or &#xhexdigits;
 */
const BARE_AMPERSAND_RE = /&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/;

/** XML 1.0 §4.6 predefined entities (decode). */
const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  apos: "'",
  quot: '"',
};

/** XML 1.0 §4.6 predefined entities (encode). */
const ENTITY_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

/** Entity map extended with whitespace for attribute values (§3.3.3). */
const ATTR_ENTITY_MAP: Record<string, string> = {
  ...ENTITY_MAP,
  "\t": "&#9;",
  "\n": "&#10;",
  "\r": "&#13;",
};

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
    // Character reference (decimal or hexadecimal)
    if (entity.startsWith("#")) {
      const isHex = entity[1] === "x";
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      // Invalid per XML 1.0 §4.1 WFC: Legal Character - must match Char production
      return isValidXmlChar(codePoint)
        ? String.fromCodePoint(codePoint)
        : match;
    }
    // Named entity - return as-is if unknown
    return NAMED_ENTITIES[entity] ?? match;
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
  return text.replace(SPECIAL_CHARS_RE, (c) => ENTITY_MAP[c]!);
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
  return value.replace(ATTR_ENCODE_RE, (c) => ATTR_ENTITY_MAP[c]!);
}
