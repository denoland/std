// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.

import {
  AMPERSAND,
  ASTERISK,
  BOM,
  COLON,
  COMMA,
  COMMERCIAL_AT,
  DOUBLE_QUOTE,
  EXCLAMATION,
  GRAVE_ACCENT,
  GREATER_THAN,
  isWhiteSpace,
  LEFT_CURLY_BRACKET,
  LEFT_SQUARE_BRACKET,
  LINE_FEED,
  MINUS,
  PERCENT,
  QUESTION,
  RIGHT_CURLY_BRACKET,
  RIGHT_SQUARE_BRACKET,
  SHARP,
  SINGLE_QUOTE,
  VERTICAL_LINE,
} from "./_chars.ts";
import {
  DumperState as StableDumperState,
  type DumperStateOptions as StableDumperStateOptions,
} from "./_dumper_state.ts";

const STYLE_PLAIN = 1;
const STYLE_SINGLE = 2;
const STYLE_LITERAL = 3;
const STYLE_FOLDED = 4;
const STYLE_DOUBLE = 5;

const LEADING_SPACE_REGEXP = /^\n* /;

/**
 * @link https://yaml.org/spec/1.2.2/ 5.1. Character Set
 * @return `true` if the character is printable without escaping, `false` otherwise.
 */
function isPrintable(c: number): boolean {
  return (
    (0x00020 <= c && c <= 0x00007e) ||
    (0x000a1 <= c && c <= 0x00d7ff && c !== 0x2028 && c !== 0x2029) ||
    (0x0e000 <= c && c <= 0x00fffd && c !== BOM) ||
    (0x10000 <= c && c <= 0x10ffff)
  );
}

/**
 * @return `true` if value is allowed after the first character in plain style, `false` otherwise.
 */
function isPlainSafe(c: number): boolean {
  return (
    isPrintable(c) &&
    c !== BOM &&
    c !== COMMA &&
    c !== LEFT_SQUARE_BRACKET &&
    c !== RIGHT_SQUARE_BRACKET &&
    c !== LEFT_CURLY_BRACKET &&
    c !== RIGHT_CURLY_BRACKET &&
    c !== COLON &&
    c !== SHARP
  );
}

/**
 * @return `true` if value is allowed as the first character in plain style, `false` otherwise.
 */
function isPlainSafeFirst(c: number): boolean {
  return (
    isPlainSafe(c) &&
    !isWhiteSpace(c) &&
    c !== MINUS &&
    c !== QUESTION &&
    c !== AMPERSAND &&
    c !== ASTERISK &&
    c !== EXCLAMATION &&
    c !== VERTICAL_LINE &&
    c !== GREATER_THAN &&
    c !== SINGLE_QUOTE &&
    c !== DOUBLE_QUOTE &&
    c !== PERCENT &&
    c !== COMMERCIAL_AT &&
    c !== GRAVE_ACCENT
  );
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string: string): boolean {
  return LEADING_SPACE_REGEXP.test(string);
}

export interface DumperStateOptions extends StableDumperStateOptions {
  /**
   * Strings will be quoted using this quoting style.
   * If you specify single quotes, double quotes will still be used
   * for non-printable characters. (default: "'")
   */
  quoteStyle?: "'" | '"';
}

export class DumperState extends StableDumperState {
  quoteStyle: "'" | '"';

  constructor({
    quoteStyle = "'",
    ...rest
  }: DumperStateOptions) {
    super(rest);
    this.quoteStyle = quoteStyle;
  }

  // Determines which scalar styles are possible and returns the preferred style.
  // lineWidth = -1 => no limit.
  // Pre-conditions: str.length > 0.
  // Post-conditions:
  //  STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
  //  STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
  //  STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth !== -1).
  override chooseScalarStyle(
    string: string,
    singleLineOnly: boolean,
    lineWidth: number,
  ): number {
    const shouldTrackWidth = lineWidth !== -1;
    let hasLineBreak = false;
    let hasFoldableLine = false; // only checked if shouldTrackWidth
    let previousLineBreak = -1; // count the first line correctly
    let plain = isPlainSafeFirst(string.charCodeAt(0)) &&
      !isWhiteSpace(string.charCodeAt(string.length - 1));

    let char: number;
    let i: number;
    if (singleLineOnly) {
      // Case: no block styles.
      // Check for disallowed characters to rule out plain and single.
      for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char);
      }
    } else {
      // Case: block styles permitted.
      for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char === LINE_FEED) {
          hasLineBreak = true;
          // Check if any line can be folded.
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine ||
              // Foldable line = too long, and not more-indented.
              (i - previousLineBreak - 1 > lineWidth &&
                string[previousLineBreak + 1] !== " ");
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char);
      }
      // in case the end is missing a \n
      hasFoldableLine = hasFoldableLine ||
        (shouldTrackWidth &&
          i - previousLineBreak - 1 > lineWidth &&
          string[previousLineBreak + 1] !== " ");
    }
    // Although every style can represent \n without escaping, prefer block styles
    // for multiline, since they're more readable and they don't add empty lines.
    // Also prefer folding a super-long line.
    if (!hasLineBreak && !hasFoldableLine) {
      // Strings interpretable as another type have to be quoted;
      // e.g. the string 'true' vs. the boolean true.
      return plain && !this.implicitTypes.some((type) => type.resolve(string))
        ? STYLE_PLAIN
        : this.quoteStyle === "'"
        ? STYLE_SINGLE
        : STYLE_DOUBLE;
    }
    // Edge case: block indentation indicator can only have one digit.
    if (this.indent > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    // At this point we know block styles are valid.
    // Prefer literal style unless we want to fold.
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
}
