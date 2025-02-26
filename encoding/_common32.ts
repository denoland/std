// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

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
    buffer[o++] = alphabet[buffer[i - 4]! >> 3]!;
    buffer[o++] =
      alphabet[((buffer[i - 4]! & 7) << 2) | (buffer[i - 3]! >> 6)]!;
    buffer[o++] = alphabet[(buffer[i - 3]! >> 1) & 31]!;
    buffer[o++] =
      alphabet[((buffer[i - 3]! & 1) << 4) | (buffer[i - 2]! >> 4)]!;
    buffer[o++] =
      alphabet[((buffer[i - 2]! & 15) << 1) | (buffer[i - 1]! >> 7)]!;
    buffer[o++] = alphabet[(buffer[i - 1]! >> 2) & 31]!;
    buffer[o++] = alphabet[((buffer[i - 1]! & 3) << 3) | (buffer[i]! >> 5)]!;
    buffer[o++] = alphabet[buffer[i]! & 31]!;
  }
  switch (i) {
    case buffer.length + 3:
      buffer[o++] = alphabet[buffer[i - 4]! >> 3]!;
      buffer[o++] = alphabet[(buffer[i - 4]! & 7) << 2]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    case buffer.length + 2:
      buffer[o++] = alphabet[buffer[i - 4]! >> 3]!;
      buffer[o++] =
        alphabet[((buffer[i - 4]! & 7) << 2) | (buffer[i - 3]! >> 6)]!;
      buffer[o++] = alphabet[(buffer[i - 3]! >> 1) & 31]!;
      buffer[o++] = alphabet[(buffer[i - 3]! & 1) << 4]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    case buffer.length + 1:
      buffer[o++] = alphabet[buffer[i - 4]! >> 3]!;
      buffer[o++] =
        alphabet[((buffer[i - 4]! & 7) << 2) | (buffer[i - 3]! >> 6)]!;
      buffer[o++] = alphabet[(buffer[i - 3]! >> 1) & 31]!;
      buffer[o++] =
        alphabet[((buffer[i - 3]! & 1) << 4) | (buffer[i - 2]! >> 4)]!;
      buffer[o++] = alphabet[(buffer[i - 2]! & 15) << 1 & 0x1F]!;
      buffer[o++] = padding;
      buffer[o++] = padding;
      buffer[o++] = padding;
      break;
    case buffer.length:
      buffer[o++] = alphabet[buffer[i - 4]! >> 3]!;
      buffer[o++] =
        alphabet[((buffer[i - 4]! & 7) << 2) | (buffer[i - 3]! >> 6)]!;
      buffer[o++] = alphabet[(buffer[i - 3]! >> 1) & 31]!;
      buffer[o++] =
        alphabet[((buffer[i - 3]! & 1) << 4) | (buffer[i - 2]! >> 4)]!;
      buffer[o++] = alphabet[(buffer[i - 2]! & 15) << 1 & 0x1F]!;
      buffer[o++] = alphabet[(buffer[i - 1]! >> 2) & 31]!;
      buffer[o++] = alphabet[(buffer[i - 1]! & 3) << 3]!;
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
  switch (buffer.length % 8) {
    case 6:
    case 3:
    case 1:
      throw new TypeError("Invalid Character");
  }
  for (let x = buffer.length - 6; x < buffer.length; ++x) {
    if (buffer[x] === padding) {
      for (let y = x + 1; y < buffer.length; ++y) {
        if (buffer[y] !== padding) throw new TypeError("Invalid Character");
      }
      buffer = buffer.subarray(0, x);
      break;
    }
  }

  i += 7;
  for (; i < buffer.length; i += 8) {
    assertChar(buffer[i - 7]!);
    assertChar(buffer[i - 6]!);
    assertChar(buffer[i - 5]!);
    assertChar(buffer[i - 4]!);
    assertChar(buffer[i - 3]!);
    assertChar(buffer[i - 2]!);
    assertChar(buffer[i - 1]!);
    assertChar(buffer[i]!);
    buffer[o++] = (alphabet[buffer[i - 7]!]! << 3) |
      (alphabet[buffer[i - 6]!]! >> 2);
    buffer[o++] = ((alphabet[buffer[i - 6]!]! & 3) << 6) |
      (alphabet[buffer[i - 5]!]! << 1) |
      (alphabet[buffer[i - 4]!]! >> 4);
    buffer[o++] = ((alphabet[buffer[i - 4]!]! & 15) << 4) |
      (alphabet[buffer[i - 3]!]! >> 1);
    buffer[o++] = ((alphabet[buffer[i - 3]!]! & 1) << 7) |
      (alphabet[buffer[i - 2]!]! << 2) |
      (alphabet[buffer[i - 1]!]! >> 3);
    buffer[o++] = ((alphabet[buffer[i - 1]!]! & 3) << 5) |
      alphabet[buffer[i]!]!;
  }
  switch (i) {
    case buffer.length + 5:
      assertChar(buffer[i - 7]!);
      assertChar(buffer[i - 6]!);
      buffer[o++] = (alphabet[buffer[i - 7]!]! << 3) |
        (alphabet[buffer[i - 6]!]! >> 2);
      break;
    case buffer.length + 3:
      assertChar(buffer[i - 7]!);
      assertChar(buffer[i - 6]!);
      assertChar(buffer[i - 5]!);
      assertChar(buffer[i - 4]!);
      buffer[o++] = (alphabet[buffer[i - 7]!]! << 3) |
        (alphabet[buffer[i - 6]!]! >> 2);
      buffer[o++] = ((alphabet[buffer[i - 6]!]! & 3) << 6) |
        (alphabet[buffer[i - 5]!]! << 1) |
        (alphabet[buffer[i - 4]!]! >> 4);
      break;
    case buffer.length + 2:
      assertChar(buffer[i - 7]!);
      assertChar(buffer[i - 6]!);
      assertChar(buffer[i - 5]!);
      assertChar(buffer[i - 4]!);
      assertChar(buffer[i - 3]!);
      buffer[o++] = (alphabet[buffer[i - 7]!]! << 3) |
        (alphabet[buffer[i - 6]!]! >> 2);
      buffer[o++] = ((alphabet[buffer[i - 6]!]! & 3) << 6) |
        (alphabet[buffer[i - 5]!]! << 1) |
        (alphabet[buffer[i - 4]!]! >> 4);
      buffer[o++] = ((alphabet[buffer[i - 4]!]! & 15) << 4) |
        (alphabet[buffer[i - 3]!]! >> 1);
      break;
    case buffer.length:
      assertChar(buffer[i - 7]!);
      assertChar(buffer[i - 6]!);
      assertChar(buffer[i - 5]!);
      assertChar(buffer[i - 4]!);
      assertChar(buffer[i - 3]!);
      assertChar(buffer[i - 2]!);
      assertChar(buffer[i - 1]!);
      buffer[o++] = (alphabet[buffer[i - 7]!]! << 3) |
        (alphabet[buffer[i - 6]!]! >> 2);
      buffer[o++] = ((alphabet[buffer[i - 6]!]! & 3) << 6) |
        (alphabet[buffer[i - 5]!]! << 1) |
        (alphabet[buffer[i - 4]!]! >> 4);
      buffer[o++] = ((alphabet[buffer[i - 4]!]! & 15) << 4) |
        (alphabet[buffer[i - 3]!]! >> 1);
      buffer[o++] = ((alphabet[buffer[i - 3]!]! & 1) << 7) |
        (alphabet[buffer[i - 2]!]! << 2) |
        (alphabet[buffer[i - 1]!]! >> 3);
      break;
  }
  return o;
}
