// Copyright 2018-2025 the Deno authors. MIT license.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

/**
 * Calculate the output size needed to encode a given input size for
 * {@linkcode encodeRawHex}.
 *
 * @param originalSize The size of the input buffer.
 * @returns The size of the output buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { calcMax } from "@std/encoding/unstable-hex";
 *
 * assertEquals(calcMax(1), 2);
 * ```
 */
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
    const x = buffer[i]!;
    buffer[o++] = alphabet[x >> 4]!;
    buffer[o++] = alphabet[x & 0xF]!;
  }
  return o;
}

export function decode(
  buffer: Uint8Array_,
  i: number,
  o: number,
  alphabet: Uint8Array,
): number {
  if ((buffer.length - o) % 2 === 1) {
    throw new TypeError(
      `Cannot decode input as hex: Invalid character (${
        String.fromCharCode(buffer[buffer.length - 1]!)
      })`,
    );
  }

  i += 1;
  for (; i < buffer.length; i += 2) {
    buffer[o++] = (getByte(buffer[i - 1]!, alphabet) << 4) |
      getByte(buffer[i]!, alphabet);
  }
  return o;
}

function getByte(char: number, alphabet: Uint8Array): number {
  const byte = alphabet[char] ?? 16;
  if (byte === 16) { // alphabet.Hex.length
    throw new TypeError(
      `Cannot decode input as hex: Invalid character (${
        String.fromCharCode(char)
      })`,
    );
  }
  return byte;
}
