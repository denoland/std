// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

const alphabet = new TextEncoder().encode("0123456789abcdef");
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);
new TextEncoder()
  .encode("ABCDEF")
  .forEach((byte, i) => rAlphabet[byte] = i + 10);

export function encodeHex(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawHex(input));
}

export function encodeRawHex(
  input: Uint8Array_,
): Uint8Array_ {
  const originalSize = input.length;
  const maxSize = originalSize * 2;
  if (input.byteOffset) {
    const buffer = new Uint8Array(input.buffer);
    buffer.set(input);
    input = buffer.subarray(0, input.length);
  }
  const output = new Uint8Array(input.buffer.transfer(maxSize));
  output.set(output.subarray(0, originalSize), maxSize - originalSize);

  let i = maxSize - originalSize;
  let o = 0;
  for (; i < output.length; ++i) {
    output[o++] = alphabet[output[i]! >> 4]!;
    output[o++] = alphabet[output[i]! & 0xF]!;
  }

  return output;
}

export function decodeHex(input: string): Uint8Array_ {
  return decodeRawHex(new TextEncoder()
    .encode(input) as Uint8Array_);
}

export function decodeRawHex(
  input: Uint8Array_,
): Uint8Array_ {
  if (input.length % 2 === 1) throw new TypeError("Invalid Character");

  let i = 1;
  let o = 0;
  for (; i < input.length; i += 2) {
    input[i - 1] = offsetByte(input[i - 1]!);
    input[i] = offsetByte(input[i]!);
    input[o++] = (input[i - 1]! << 4) | input[i]!;
  }

  return input.subarray(0, o);
}

function offsetByte(byte: number): number {
  if (
    !(
      (48 <= byte && byte <= 57) ||
      (97 <= byte && byte <= 102) ||
      (65 <= byte && byte <= 70)
    )
  ) throw new TypeError("Invalid Character");
  return rAlphabet[byte]!;
}
