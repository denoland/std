// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

/**
 * Calculate the output size needed to encode a given input size for
 * {@linkcode encodeRawBase64}.
 *
 * @param originalSize The size of the input buffer.
 * @returns The size of the output buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(calcMax(1), 4);
 * ```
 */
export function calcMax(originalSize: number): number {
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
    buffer[o++] = alphabet[buffer[i - 2]! >> 2]!;
    buffer[o++] =
      alphabet[((buffer[i - 2]! & 0x3) << 4) | (buffer[i - 1]! >> 4)]!;
    buffer[o++] = alphabet[((buffer[i - 1]! & 0xF) << 2) | (buffer[i]! >> 6)]!;
    buffer[o++] = alphabet[buffer[i]! & 0x3F]!;
  }
  switch (i) {
    case buffer.length + 1:
      buffer[o++] = alphabet[buffer[i - 2]! >> 2]!;
      buffer[o++] = alphabet[(buffer[i - 2]! & 0x3) << 4]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    case buffer.length:
      buffer[o++] = alphabet[buffer[i - 2]! >> 2]!;
      buffer[o++] =
        alphabet[((buffer[i - 2]! & 0x3) << 4) | (buffer[i - 1]! >> 4)]!;
      buffer[o++] =
        alphabet[((buffer[i - 1]! & 0xF) << 2) | (buffer[i]! >> 6)]!;
      buffer[o++] = padding;
      break;
  }
  return o;
}

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  padding: number,
  assertChar: (byte: number) => void,
): number {
  for (let x = buffer.length - 2; x < buffer.length; ++x) {
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
  if ((buffer.length - o) % 4 === 1) {
    throw new TypeError(
      `Invalid Character (${String.fromCharCode(buffer[buffer.length - 1]!)})`,
    );
  }

  i += 3;
  for (; i < buffer.length; i += 4) {
    assertChar(buffer[i - 3]!);
    assertChar(buffer[i - 2]!);
    assertChar(buffer[i - 1]!);
    assertChar(buffer[i]!);
    buffer[o++] = (alphabet[buffer[i - 3]!]! << 2) |
      (alphabet[buffer[i - 2]!]! >> 4);
    buffer[o++] = ((alphabet[buffer[i - 2]!]! & 0xF) << 4) |
      (alphabet[buffer[i - 1]!]! >> 2);
    buffer[o++] = ((alphabet[buffer[i - 1]!]! & 0x3) << 6) |
      alphabet[buffer[i]!]!;
  }
  switch (i) {
    case buffer.length + 1:
      assertChar(buffer[i - 3]!);
      assertChar(buffer[i - 2]!);
      buffer[o++] = (alphabet[buffer[i - 3]!]! << 2) |
        (alphabet[buffer[i - 2]!]! >> 4);
      break;
    case buffer.length:
      assertChar(buffer[i - 3]!);
      assertChar(buffer[i - 2]!);
      assertChar(buffer[i - 1]!);
      buffer[o++] = (alphabet[buffer[i - 3]!]! << 2) |
        (alphabet[buffer[i - 2]!]! >> 4);
      buffer[o++] = ((alphabet[buffer[i - 2]!]! & 0xF) << 4) |
        (alphabet[buffer[i - 1]!]! >> 2);
      break;
  }
  return o;
}
