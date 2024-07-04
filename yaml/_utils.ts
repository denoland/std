// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore no-explicit-any
export type Any = any;

export interface ArrayObject<T = Any> {
  [P: string]: T;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean" || value instanceof Boolean;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function isNegativeZero(i: number): boolean {
  return i === 0 && Number.NEGATIVE_INFINITY === 1 / i;
}

export function getObjectTypeString(object: unknown) {
  return Object.prototype.toString.call(object);
}

/**
 * Converts a hexadecimal character code to its decimal value.
 */
export function hexCharCodeToNumber(charCode: number) {
  // Check if the character code is in the range for '0' to '9'
  if (0x30 <= charCode && charCode <= 0x39) return charCode - 0x30; // Convert '0'-'9' to 0-9

  // Normalize the character code to lowercase if it's a letter
  const lc = charCode | 0x20;

  // Check if the character code is in the range for 'a' to 'f'
  if (0x61 <= lc && lc <= 0x66) return lc - 0x61 + 10; // Convert 'a'-'f' to 10-15

  return -1;
}

/**
 * Converts a decimal character code to its decimal value.
 */
export function decimalCharCodeToNumber(charCode: number): number {
  // Check if the character code is in the range for '0' to '9'
  if (0x30 <= charCode && charCode <= 0x39) return charCode - 0x30; // Convert '0'-'9' to 0-9
  return -1;
}

/**
 * Converts a Unicode code point to a string.
 */
export function codepointToChar(codepoint: number): string {
  // Check if the code point is within the Basic Multilingual Plane (BMP)
  if (codepoint <= 0xffff) return String.fromCharCode(codepoint); // Convert BMP code point to character

  // Encode UTF-16 surrogate pair for code points beyond BMP
  // Reference: https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((codepoint - 0x010000) >> 10) + 0xd800, // High surrogate
    ((codepoint - 0x010000) & 0x03ff) + 0xdc00, // Low surrogate
  );
}

/**
 * Encodes a Unicode character code point as a hexadecimal escape sequence.
 */
export function charCodeToHexString(charCode: number): string {
  const hexString = charCode.toString(16).toUpperCase();
  if (charCode <= 0xff) return `\\x${hexString.padStart(2, "0")}`;
  if (charCode <= 0xffff) return `\\u${hexString.padStart(4, "0")}`;
  if (charCode <= 0xffffffff) return `\\U${hexString.padStart(8, "0")}`;
  throw new Error(
    "Code point within a string may not be greater than 0xFFFFFFFF",
  );
}
