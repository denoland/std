// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

const encoder = new TextEncoder();
export const padding = "=".charCodeAt(0);
export const alphabet: Record<Base64Alphabet, Uint8Array> = {
  base64: encoder
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),
  base64url: encoder
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"),
};
export const rAlphabet: Record<Base64Alphabet, Uint8Array> = {
  base64: new Uint8Array(128).fill(64), // alphabet.base64.length
  base64url: new Uint8Array(128).fill(64),
};
alphabet.base64
  .forEach((byte, i) => rAlphabet.base64[byte] = i);
alphabet.base64url
  .forEach((byte, i) => rAlphabet.base64url[byte] = i);

const WHITE_SPACE = new Uint8Array(256);
for (const byte of encoder.encode("\t\n\f\r ")) WHITE_SPACE[byte] = 1;

/**
 * Options for encoding and decoding base64 strings.
 */
export interface Base64Options {
  /** The base64 alphabet. Defaults to "base64" */
  alphabet?: Base64Alphabet;
}

/**
 * The base64 alphabets.
 */
export type Base64Alphabet = "base64" | "base64url";

/**
 * Calculate the output size needed to encode a given input size for
 * {@linkcode encodeIntoBase64}.
 *
 * @param originalSize The size of the input buffer.
 * @returns The size of the output buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { calcSizeBase64 } from "@std/encoding/unstable-base64";
 *
 * assertEquals(calcSizeBase64(1), 4);
 * ```
 */
export function calcSizeBase64(originalSize: number): number {
  return ((originalSize + 2) / 3 | 0) * 4;
}

export function encode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  i += 2;
  for (; i < buffer.length; i += 3) {
    const x = (buffer[i - 2]! << 16) | (buffer[i - 1]! << 8) | buffer[i]!;
    buffer[o++] = alphabet[x >> 18]!;
    buffer[o++] = alphabet[x >> 12 & 0x3F]!;
    buffer[o++] = alphabet[x >> 6 & 0x3F]!;
    buffer[o++] = alphabet[x & 0x3F]!;
  }
  switch (i) {
    case buffer.length + 1: {
      const x = buffer[i - 2]! << 16;
      buffer[o++] = alphabet[x >> 18]!;
      buffer[o++] = alphabet[x >> 12 & 0x3F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    }
    case buffer.length: {
      const x = (buffer[i - 2]! << 16) | (buffer[i - 1]! << 8);
      buffer[o++] = alphabet[x >> 18]!;
      buffer[o++] = alphabet[x >> 12 & 0x3F]!;
      buffer[o++] = alphabet[x >> 6 & 0x3F]!;
      buffer[o++] = padding;
      break;
    }
  }
  return o;
}

function removeWhiteSpace(buffer: Uint8Array_) {
  const length = buffer.length;

  const indices: number[] = [];

  for (let i = 0; i < length; ++i) {
    if (WHITE_SPACE[buffer[i]!]) indices.push(i);
  }

  for (let i = 0; i < indices.length; ++i) {
    const index = indices[i]!;
    const start = index + 1;
    const end = i === indices.length - 1 ? length : indices[i + 1]!;

    buffer.set(buffer.subarray(start, end), index - i);
  }

  return buffer.subarray(0, length - indices.length);
}

class RetriableError extends Error {}

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  try {
    return _decode(buffer, i, o, alphabet, padding, true);
  } catch (e) {
    if (!(e instanceof RetriableError)) throw e;
    return _decode(removeWhiteSpace(buffer), i, o, alphabet, padding, false);
  }
}

function _decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
  firstPass: boolean,
) {
  const getHextet = (i: number): number => {
    const char = buffer[i]!;
    const hextet = alphabet[char] ?? 64;
    if (hextet === 64) { // alphabet.Base64.length
      if (firstPass && WHITE_SPACE[char]) throw new RetriableError();
      throw new TypeError(
        `Cannot decode input as base64: Invalid character (${
          String.fromCharCode(char)
        })`,
      );
    }
    return hextet;
  };

  for (let x = buffer.length - 2; x < buffer.length; ++x) {
    if (buffer[x] === padding) {
      for (let y = x + 1; y < buffer.length; ++y) {
        if (buffer[y] !== padding) {
          if (firstPass && WHITE_SPACE[buffer[y]!]) throw new RetriableError();
          throw new TypeError(
            `Cannot decode input as base64: Invalid character (${
              String.fromCharCode(buffer[y]!)
            })`,
          );
        }
      }
      buffer = buffer.subarray(0, x);
      break;
    }
  }
  if ((buffer.length - o) % 4 === 1) {
    if (firstPass) throw new RetriableError();
    throw new RangeError(
      `Cannot decode input as base64: Length (${
        buffer.length - o
      }), excluding padding, must not have a remainder of 1 when divided by 4`,
    );
  }

  i += 3;
  for (; i < buffer.length; i += 4) {
    const x = (getHextet(i - 3) << 18) |
      (getHextet(i - 2) << 12) |
      (getHextet(i - 1) << 6) |
      getHextet(i);
    buffer[o++] = x >> 16;
    buffer[o++] = x >> 8 & 0xFF;
    buffer[o++] = x & 0xFF;
  }
  switch (i) {
    case buffer.length + 1: {
      const x = (getHextet(i - 3) << 18) |
        (getHextet(i - 2) << 12);
      buffer[o++] = x >> 16;
      break;
    }
    case buffer.length: {
      const x = (getHextet(i - 3) << 18) |
        (getHextet(i - 2) << 12) |
        (getHextet(i - 1) << 6);
      buffer[o++] = x >> 16;
      buffer[o++] = x >> 8 & 0xFF;
      break;
    }
  }
  return o;
}
