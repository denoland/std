// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

export function calcMax(originalSize: number): number {
  return originalSize * 2;
}

export function encode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
): number {
  for (; i < buffer.length; ++i) {
    buffer[o++] = alphabet[buffer[i]! >> 4]!;
    buffer[o++] = alphabet[buffer[i]! & 0xF]!;
  }
  return o;
}

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
  assertChar: (byte: number) => void,
): number {
  if (buffer.length % 2 === 1) throw new TypeError("Invalid Character");

  i += 1;
  for (; i < buffer.length; i += 2) {
    assertChar(buffer[i - 1]!);
    assertChar(buffer[i]!);
    buffer[o++] = (alphabet[buffer[i - 1]!]! << 4) | alphabet[buffer[i]!]!;
  }
  return o;
}
