// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

/**
 * Calculate the output size needed to encode a given input size for
 * {@linkcode encodeRawBase32}.
 *
 * @param originalSize The size of the input buffer.
 * @returns The size of the output buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { calcMax } from "@std/encoding/unstable-base32";
 *
 * assertEquals(calcMax(1), 8);
 * ```
 */
export function calcMax(originalSize: number): number {
  return ((originalSize + 4) / 5 | 0) * 8;
}

export function encode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  i += 4;
  for (; i < buffer.length; i += 5) {
    let x = (buffer[i - 4]! << 16) | (buffer[i - 3]! << 8) | buffer[i - 2]!;
    buffer[o++] = alphabet[x >> 19]!;
    buffer[o++] = alphabet[x >> 14 & 0x1F]!;
    buffer[o++] = alphabet[x >> 9 & 0x1F]!;
    buffer[o++] = alphabet[x >> 4 & 0x1F]!;
    x = (x << 16) | (buffer[i - 1]! << 8) | buffer[i]!;
    buffer[o++] = alphabet[x >> 15 & 0x1F]!;
    buffer[o++] = alphabet[x >> 10 & 0x1F]!;
    buffer[o++] = alphabet[x >> 5 & 0x1F]!;
    buffer[o++] = alphabet[x & 0x1F]!;
  }
  switch (i) {
    case buffer.length + 3: {
      const x = buffer[i - 4]! << 16;
      buffer[o++] = alphabet[x >> 19]!;
      buffer[o++] = alphabet[x >> 14 & 0x1F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    }
    case buffer.length + 2: {
      const x = (buffer[i - 4]! << 16) | (buffer[i - 3]! << 8);
      buffer[o++] = alphabet[x >> 19]!;
      buffer[o++] = alphabet[x >> 14 & 0x1F]!;
      buffer[o++] = alphabet[x >> 9 & 0x1F]!;
      buffer[o++] = alphabet[x >> 4 & 0x1F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    }
    case buffer.length + 1: {
      let x = (buffer[i - 4]! << 16) | (buffer[i - 3]! << 8) | buffer[i - 2]!;
      buffer[o++] = alphabet[x >> 19]!;
      buffer[o++] = alphabet[x >> 14 & 0x1F]!;
      buffer[o++] = alphabet[x >> 9 & 0x1F]!;
      buffer[o++] = alphabet[x >> 4 & 0x1F]!;
      x <<= 16;
      buffer[o++] = alphabet[x >> 15 & 0x1F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    }
    case buffer.length: {
      let x = (buffer[i - 4]! << 16) | (buffer[i - 3]! << 8) | buffer[i - 2]!;
      buffer[o++] = alphabet[x >> 19]!;
      buffer[o++] = alphabet[x >> 14 & 0x1F]!;
      buffer[o++] = alphabet[x >> 9 & 0x1F]!;
      buffer[o++] = alphabet[x >> 4 & 0x1F]!;
      x = (x << 16) | (buffer[i - 1]! << 8);
      buffer[o++] = alphabet[x >> 15 & 0x1F]!;
      buffer[o++] = alphabet[x >> 10 & 0x1F]!;
      buffer[o++] = alphabet[x >> 5 & 0x1F]!;
      buffer[o++] = padding;
      break;
    }
  }
  return o;
}

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
): number {
  for (let x = buffer.length - 6; x < buffer.length; ++x) {
    if (buffer[x] === padding) {
      for (let y = x + 1; y < buffer.length; ++y) {
        if (buffer[y] !== padding) {
          throw new TypeError(
            `Invalid Character (${String.fromCharCode(buffer[y]!)})`,
          );
        }
      }
      buffer = buffer.subarray(0, x);
      break;
    }
  }
  switch ((buffer.length - o) % 8) {
    case 6:
    case 3:
    case 1:
      throw new TypeError(
        `Invalid Character (${
          String.fromCharCode(buffer[buffer.length - 1]!)
        })`,
      );
  }

  i += 7;
  for (; i < buffer.length; i += 8) {
    let x = (getByte(buffer[i - 7]!, alphabet) << 19) |
      (getByte(buffer[i - 6]!, alphabet) << 14) |
      (getByte(buffer[i - 5]!, alphabet) << 9) |
      (getByte(buffer[i - 4]!, alphabet) << 4);
    buffer[o++] = x >> 16;
    buffer[o++] = x >> 8 & 0xFF;
    x = (x << 16) |
      (getByte(buffer[i - 3]!, alphabet) << 15) |
      (getByte(buffer[i - 2]!, alphabet) << 10) |
      (getByte(buffer[i - 1]!, alphabet) << 5) |
      getByte(buffer[i]!, alphabet);
    buffer[o++] = x >> 16 & 0xFF;
    buffer[o++] = x >> 8 & 0xFF;
    buffer[o++] = x & 0xFF;
  }
  switch (i) {
    case buffer.length + 5: {
      const x = (getByte(buffer[i - 7]!, alphabet) << 19) |
        (getByte(buffer[i - 6]!, alphabet) << 14);
      buffer[o++] = x >> 16;
      break;
    }
    case buffer.length + 3: {
      const x = (getByte(buffer[i - 7]!, alphabet) << 19) |
        (getByte(buffer[i - 6]!, alphabet) << 14) |
        (getByte(buffer[i - 5]!, alphabet) << 9) |
        (getByte(buffer[i - 4]!, alphabet) << 4);
      buffer[o++] = x >> 16;
      buffer[o++] = x >> 8 & 0xFF;
      break;
    }
    case buffer.length + 2: {
      let x = (getByte(buffer[i - 7]!, alphabet) << 19) |
        (getByte(buffer[i - 6]!, alphabet) << 14) |
        (getByte(buffer[i - 5]!, alphabet) << 9) |
        (getByte(buffer[i - 4]!, alphabet) << 4);
      buffer[o++] = x >> 16;
      buffer[o++] = x >> 8 & 0xFF;
      x = (x << 16) |
        (getByte(buffer[i - 3]!, alphabet) << 15);
      buffer[o++] = x >> 16 & 0xFF;
      break;
    }
    case buffer.length: {
      let x = (getByte(buffer[i - 7]!, alphabet) << 19) |
        (getByte(buffer[i - 6]!, alphabet) << 14) |
        (getByte(buffer[i - 5]!, alphabet) << 9) |
        (getByte(buffer[i - 4]!, alphabet) << 4);
      buffer[o++] = x >> 16;
      buffer[o++] = x >> 8 & 0xFF;
      x = (x << 16) |
        (getByte(buffer[i - 3]!, alphabet) << 15) |
        (getByte(buffer[i - 2]!, alphabet) << 10) |
        (getByte(buffer[i - 1]!, alphabet) << 5);
      buffer[o++] = x >> 16 & 0xFF;
      buffer[o++] = x >> 8 & 0xFF;
      break;
    }
  }
  return o;
}

function getByte(char: number, alphabet: Uint8Array): number {
  const byte = alphabet[char] ?? 32;
  if (byte === 32) { // alphabet.Base32.length
    throw new TypeError(`Invalid Character (${String.fromCharCode(char)})`);
  }
  return byte;
}
