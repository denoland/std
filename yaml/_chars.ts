// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.

export const BOM = "\uFEFF";
export const TAB = "\t";
export const LINE_FEED = "\n";
export const CARRIAGE_RETURN = "\r";
export const SPACE = " ";
export const EXCLAMATION = "!";
export const DOUBLE_QUOTE = '"';
export const SHARP = "#";
export const PERCENT = "%";
export const AMPERSAND = "&";
export const SINGLE_QUOTE = "'";
export const ASTERISK = "*";
export const PLUS = "+";
export const COMMA = ",";
export const MINUS = "-";
export const DOT = ".";
export const COLON = ":";
export const SMALLER_THAN = "<";
export const GREATER_THAN = ">";
export const QUESTION = "?";
export const COMMERCIAL_AT = "@";
export const LEFT_SQUARE_BRACKET = "[";
export const BACKSLASH = "\\";
export const RIGHT_SQUARE_BRACKET = "]";
export const GRAVE_ACCENT = "`";
export const LEFT_CURLY_BRACKET = "{";
export const VERTICAL_LINE = "|";
export const RIGHT_CURLY_BRACKET = "}";

export function isEOL(c: string): boolean {
  return c === LINE_FEED || c === CARRIAGE_RETURN;
}

export function isWhiteSpace(c: string): boolean {
  return c === TAB || c === SPACE;
}

export function isWhiteSpaceOrEOL(c: string): boolean {
  return isWhiteSpace(c) || isEOL(c);
}

export function isFlowIndicator(c: string): boolean {
  return (
    c === COMMA ||
    c === LEFT_SQUARE_BRACKET ||
    c === RIGHT_SQUARE_BRACKET ||
    c === LEFT_CURLY_BRACKET ||
    c === RIGHT_CURLY_BRACKET
  );
}
