// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";

const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

export function encodeBase64(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawBase64(input));
}

export function encodeRawBase64(
  input: Uint8Array_,
): Uint8Array_ {
  const originalSize = input.length;
  const maxSize = ((originalSize + 2) / 3 | 0) * 4;
  if (input.byteOffset) {
    const buffer = new Uint8Array(input.buffer);
    buffer.set(input);
    input = buffer.subarray(0, input.length);
  }
  const output = new Uint8Array(input.buffer.transfer(maxSize));
  output.set(output.subarray(0, originalSize), maxSize - originalSize);

  let i = maxSize - originalSize + 2;
  let o = 0;
  for (; i < output.length; i += 3) {
    output[o++] = alphabet[output[i - 2]! >> 2]!;
    output[o++] =
      alphabet[((output[i - 2]! & 0x3) << 4) | (output[i - 1]! >> 4)]!;
    output[o++] = alphabet[((output[i - 1]! & 0xF) << 2) | (output[i]! >> 6)]!;
    output[o++] = alphabet[output[i]! & 0x3F]!;
  }
  switch (i) {
    case output.length + 1:
      output[o++] = alphabet[output[i - 2]! >> 2]!;
      output[o++] = alphabet[(output[i - 2]! & 0x3) << 4]!;
      output[o++] = padding;
      output[o++] = padding;
      break;
    case output.length:
      output[o++] = alphabet[output[i - 2]! >> 2]!;
      output[o++] =
        alphabet[((output[i - 2]! & 0x3) << 4) | (output[i - 1]! >> 4)]!;
      output[o++] =
        alphabet[((output[i - 1]! & 0xF) << 2) | (output[i]! >> 6)]!;
      output[o++] = padding;
      break;
  }

  return output;
}

export function decodeBase64(input: string): Uint8Array_ {
  return decodeRawBase64(new TextEncoder()
    .encode(input) as Uint8Array_);
}

export function decodeRawBase64(
  input: Uint8Array_,
): Uint8Array_ {
  if (input.length % 4 === 1) throw new TypeError("Invalid Character");
  if (input[input.length - 2] === padding) {
    if (input[input.length - 1] !== padding) {
      throw new TypeError("Invalid Character");
    }
    input = input.subarray(0, input.length - 2);
  } else if (input[input.length - 1] === padding) {
    input = input.subarray(0, input.length - 1);
  }

  let i = 3;
  let o = 0;
  for (; i < input.length; i += 4) {
    input[i - 3] = offsetByte(input[i - 3]!);
    input[i - 2] = offsetByte(input[i - 2]!);
    input[i - 1] = offsetByte(input[i - 1]!);
    input[i] = offsetByte(input[i]!);
    input[o++] = (input[i - 3]! << 2) | (input[i - 2]! >> 4);
    input[o++] = ((input[i - 2]! & 0xF) << 4) | (input[i - 1]! >> 2);
    input[o++] = ((input[i - 1]! & 0x3) << 6) | input[i]!;
  }
  switch (i) {
    case input.length + 1:
      input[i - 3] = offsetByte(input[i - 3]!);
      input[i - 2] = offsetByte(input[i - 2]!);
      input[o++] = (input[i - 3]! << 2) | (input[i - 2]! >> 4);
      break;
    case input.length:
      input[i - 3] = offsetByte(input[i - 3]!);
      input[i - 2] = offsetByte(input[i - 2]!);
      input[i - 1] = offsetByte(input[i - 1]!);
      input[o++] = (input[i - 3]! << 2) | (input[i - 2]! >> 4);
      input[o++] = ((input[i - 2]! & 0xF) << 4) | (input[i - 1]! >> 2);
      break;
  }

  return input.subarray(0, o);
}

function offsetByte(byte: number): number {
  if (
    !((65 <= byte && byte <= 90) ||
      (97 <= byte && byte <= 122) ||
      (48 <= byte && byte <= 57) ||
      byte === 43 ||
      byte === 47)
  ) throw new TypeError("Invalid Character");
  return rAlphabet[byte]!;
}
