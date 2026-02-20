// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal module for XML entity encoding and decoding.
 *
 * @module
 */

// Hoisted regex patterns for performance
// Single-pass regex that matches predefined entities and char refs, while
// also detecting bare/invalid ampersands. Uses [a-zA-Z]+ (not [a-zA-Z0-9]*)
// to allow entity names with digits to pass through unchanged (non-validating).
// Group 1: named entity (letters only, e.g. "amp")
// Group 2: decimal char ref (e.g. "#13")
// Group 3: hex char ref (e.g. "#xd")
// Match with no groups: bare/invalid ampersand (if lookahead fails)
const ENTITY_OR_AMPERSAND_RE =
  /&(?:([a-zA-Z]+);|(#[0-9]+);|(#x[0-9a-fA-F]+);|(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;))/g;
const SPECIAL_CHARS_RE = /[<>&'"]/g;
const ATTR_ENCODE_RE = /[<>&'"\t\n\r]/g;

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
 * Decodes XML entities in a string.
 *
 * This parser only supports the five predefined XML entities (§4.6)
 * and numeric character references (§4.1). Custom entities defined in DTD are
 * NOT expanded - this is a deliberate design choice for:
 * - Security: Prevents entity expansion attacks (billion laughs, etc.)
 * - Simplicity: No need to track DTD entity definitions
 * - Consistency: Matches behavior of popular parsers like saxes
 *
 * External entities (SYSTEM/PUBLIC) are also not supported.
 *
 * @returns The text with predefined entities decoded.
 * @throws {Error} If the text contains invalid or unknown entity references.
 */
export function decodeEntities(text: string): string {
  // Fast path: no ampersand means no entities to decode
  if (!text.includes("&")) return text;

  // Single-pass: decode predefined entities and char refs, error on invalid
  return text.replace(
    ENTITY_OR_AMPERSAND_RE,
    (
      match: string,
      namedEntity: string | undefined,
      decimalRef: string | undefined,
      hexRef: string | undefined,
      offset: number,
    ) => {
      // Hex character reference (&#xNN;)
      if (hexRef !== undefined) {
        const codePoint = parseInt(hexRef.slice(2), 16);
        if (!isValidXmlChar(codePoint)) {
          throw new Error(
            `Invalid character reference '${match}' at position ${offset}: ` +
              `code point ${codePoint} is not a valid XML character`,
          );
        }
        return String.fromCodePoint(codePoint);
      }

      // Decimal character reference (&#NN;)
      if (decimalRef !== undefined) {
        const codePoint = parseInt(decimalRef.slice(1), 10);
        if (!isValidXmlChar(codePoint)) {
          throw new Error(
            `Invalid character reference '${match}' at position ${offset}: ` +
              `code point ${codePoint} is not a valid XML character`,
          );
        }
        return String.fromCodePoint(codePoint);
      }

      // Named entity (&name;) - only letters matched
      if (namedEntity !== undefined) {
        const predefined = NAMED_ENTITIES[namedEntity];
        if (predefined !== undefined) {
          return predefined;
        }
        // Unknown letter-only entity
        throw new Error(
          `Unknown entity '${match}' at position ${offset}: ` +
            `only predefined entities (lt, gt, amp, apos, quot) are recognized`,
        );
      }

      // Bare ampersand (no valid entity pattern matched)
      throw new Error(
        `Invalid bare '&' at position ${offset}: ` +
          `use &amp; or a valid entity reference (&name;, &#num;, &#xHex;)`,
      );
    },
  );
}

/**
 * Encodes special characters as XML entities.
 *
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
 * @returns The encoded attribute value.
 */
export function encodeAttributeValue(value: string): string {
  // Fast path: no special characters means nothing to encode
  if (!/[<>&'"\t\n\r]/.test(value)) return value;
  return value.replace(ATTR_ENCODE_RE, (c) => ATTR_ENTITY_MAP[c]!);
}
