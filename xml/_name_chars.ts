// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * XML 1.0 Fifth Edition name character validation.
 *
 * Provides optimized validation for NameStartChar and NameChar per the XML spec:
 * https://www.w3.org/TR/xml/#NT-NameStartChar
 *
 * Performance strategy:
 * 1. Inline ASCII checks (99%+ of real-world XML) - no memory access
 * 2. Lookup table for Latin-1 Supplement (0x80-0xFF) - 128 bytes
 * 3. Ordered range checks for Unicode (0x100+) - most common ranges first
 *
 * @module
 */

// =============================================================================
// LOOKUP TABLES FOR LATIN-1 SUPPLEMENT (0x80-0xFF)
// =============================================================================

/**
 * Pre-computed lookup table for Latin-1 Supplement NameStartChar (0x80-0xFF).
 * Valid: [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#xFF]
 * Invalid: 0x80-0xBF, 0xD7 (×), 0xF7 (÷)
 */
const LATIN1_NAME_START = new Uint8Array(128);

/**
 * Pre-computed lookup table for Latin-1 Supplement NameChar (0x80-0xFF).
 * Same as NameStartChar plus 0xB7 (·)
 */
const LATIN1_NAME_CHAR = new Uint8Array(128);

// Initialize Latin-1 tables at module load
for (let i = 0; i < 128; i++) {
  const code = i + 0x80;

  // NameStartChar: [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#xFF]
  LATIN1_NAME_START[i] = (
      (code >= 0xC0 && code <= 0xD6) ||
      (code >= 0xD8 && code <= 0xF6) ||
      code >= 0xF8
    )
    ? 1
    : 0;

  // NameChar: NameStartChar + 0xB7
  LATIN1_NAME_CHAR[i] = (LATIN1_NAME_START[i] === 1 || code === 0xB7) ? 1 : 0;
}

// =============================================================================
// UNICODE RANGE VALIDATION (code >= 0x100)
// =============================================================================

/**
 * Check if a Unicode code point (>= 0x100) is a valid NameStartChar.
 * Ranges ordered by frequency in real-world XML (CJK is common).
 *
 * XML 1.0 Fifth Edition NameStartChar (non-ASCII portion):
 *   [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] |
 *   [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] |
 *   [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
 */
function isUnicodeNameStartChar(code: number): boolean {
  // [#x3001-#xD7FF] - CJK, Hangul, etc. (most common non-ASCII in real XML)
  if (code >= 0x3001 && code <= 0xD7FF) return true;

  // [#x100-#x2FF] - Latin Extended-A/B, IPA Extensions, Spacing Modifiers
  if (code >= 0x100 && code <= 0x2FF) return true;

  // [#x370-#x37D] | [#x37F-#x1FFF] - Greek, Cyrillic, Armenian, Hebrew, Arabic, etc.
  if (code >= 0x370 && code <= 0x1FFF) return code !== 0x37E;

  // [#x2C00-#x2FEF] - Glagolitic, Latin Extended-C/D, Coptic, Georgian Supplement
  if (code >= 0x2C00 && code <= 0x2FEF) return true;

  // [#xF900-#xFDCF] | [#xFDF0-#xFFFD] - CJK Compatibility, Arabic Presentation Forms
  if (code >= 0xF900 && code <= 0xFFFD) {
    return code <= 0xFDCF || code >= 0xFDF0;
  }

  // [#x2070-#x218F] - Superscripts, Currency, Letterlike, Number Forms
  if (code >= 0x2070 && code <= 0x218F) return true;

  // [#x200C-#x200D] - Zero-width non-joiner/joiner
  if (code === 0x200C || code === 0x200D) return true;

  // [#x10000-#xEFFFF] - Astral planes (SMP, SIP, TIP)
  if (code >= 0x10000 && code <= 0xEFFFF) return true;

  return false;
}

/**
 * Check if a Unicode code point (>= 0x100) is a valid NameChar.
 *
 * Additional NameChar code points beyond NameStartChar:
 *   #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
 */
function isUnicodeNameChar(code: number): boolean {
  // NameChar includes all of NameStartChar
  if (isUnicodeNameStartChar(code)) return true;

  // [#x0300-#x036F] - Combining Diacritical Marks
  if (code >= 0x0300 && code <= 0x036F) return true;

  // [#x203F-#x2040] - Undertie, Character Tie
  if (code === 0x203F || code === 0x2040) return true;

  return false;
}

// =============================================================================
// MAIN VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a code point is a valid XML NameStartChar.
 *
 * NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] |
 *                   [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] |
 *                   [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
 *                   [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] |
 *                   [#x10000-#xEFFFF]
 *
 * Optimized for the common case (ASCII letters, underscore, colon).
 *
 * @returns true if valid NameStartChar, false otherwise.
 */
export function isNameStartChar(code: number): boolean {
  // Fast ASCII path (handles 99%+ of real-world XML)
  if (code < 0x80) {
    return (code >= 0x61 && code <= 0x7A) || // a-z (most common)
      (code >= 0x41 && code <= 0x5A) || // A-Z
      code === 0x5F || code === 0x3A; // _ :
  }

  // Latin-1 Supplement (0x80-0xFF): use lookup table
  if (code < 0x100) {
    return LATIN1_NAME_START[code - 0x80] === 1;
  }

  // Unicode (>= 0x100): use range checks
  return isUnicodeNameStartChar(code);
}

/**
 * Check if a code point is a valid XML NameChar.
 *
 * NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 |
 *              [#x0300-#x036F] | [#x203F-#x2040]
 *
 * Optimized for the common case (ASCII alphanumerics, underscore, colon, hyphen, dot).
 *
 * @returns true if valid NameChar, false otherwise.
 */
export function isNameChar(code: number): boolean {
  // Fast ASCII path (handles 99%+ of real-world XML)
  if (code < 0x80) {
    return (code >= 0x61 && code <= 0x7A) || // a-z (most common)
      (code >= 0x41 && code <= 0x5A) || // A-Z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x5F || code === 0x3A || // _ :
      code === 0x2D || code === 0x2E; // - .
  }

  // Latin-1 Supplement (0x80-0xFF): use lookup table
  if (code < 0x100) {
    return LATIN1_NAME_CHAR[code - 0x80] === 1;
  }

  // Unicode (>= 0x100): use range checks
  return isUnicodeNameChar(code);
}
