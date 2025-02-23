// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";

const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

export function encodeBase32(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawBase32(input));
}

export function encodeRawBase32(
  input: Uint8Array_,
): Uint8Array_ {
  const originalSize = input.length;
  const maxSize = ((originalSize + 4) / 5 | 0) * 8;
  if (input.byteOffset) {
    const buffer = new Uint8Array(input.buffer);
    buffer.set(input);
    input = buffer.subarray(0, input.length);
  }
  const output = new Uint8Array(input.buffer.transfer(maxSize));
  output.set(output.subarray(0, originalSize), maxSize - originalSize);

  let i = maxSize - originalSize + 4;
  let o = 0;
  for (; i < output.length; i += 5) {
    output[o++] = alphabet[output[i - 4]! >> 3]!;
    output[o++] =
      alphabet[((output[i - 4]! & 7) << 2) | (output[i - 3]! >> 6)]!;
    output[o++] = alphabet[(output[i - 3]! >> 1) & 31]!;
    output[o++] =
      alphabet[((output[i - 3]! & 1) << 4) | (output[i - 2]! >> 4)]!;
    output[o++] =
      alphabet[((output[i - 2]! & 15) << 1) | (output[i - 1]! >> 7)]!;
    output[o++] = alphabet[(output[i - 1]! >> 2) & 31]!;
    output[o++] = alphabet[((output[i - 1]! & 3) << 3) | (output[i]! >> 5)]!;
    output[o++] = alphabet[output[i]! & 31]!;
  }
  switch (i) {
    case output.length + 3:
      output[o++] = alphabet[output[i - 4]! >> 3]!;
      output[o++] = alphabet[(output[i - 4]! & 7) << 2]!;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      break;
    case output.length + 2:
      output[o++] = alphabet[output[i - 4]! >> 3]!;
      output[o++] =
        alphabet[((output[i - 4]! & 7) << 2) | (output[i - 3]! >> 6)]!;
      output[o++] = alphabet[(output[i - 3]! >> 1) & 31]!;
      output[o++] = alphabet[(output[i - 3]! & 1) << 4]!;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      break;
    case output.length + 1:
      output[o++] = alphabet[output[i - 4]! >> 3]!;
      output[o++] =
        alphabet[((output[i - 4]! & 7) << 2) | (output[i - 3]! >> 6)]!;
      output[o++] = alphabet[(output[i - 3]! >> 1) & 31]!;
      output[o++] =
        alphabet[((output[i - 3]! & 1) << 4) | (output[i - 2]! >> 4)]!;
      output[o++] = alphabet[(output[i - 2]! & 15) << 1 & 0x1F]!;
      output[o++] = padding;
      output[o++] = padding;
      output[o++] = padding;
      break;
    case output.length:
      output[o++] = alphabet[output[i - 4]! >> 3]!;
      output[o++] =
        alphabet[((output[i - 4]! & 7) << 2) | (output[i - 3]! >> 6)]!;
      output[o++] = alphabet[(output[i - 3]! >> 1) & 31]!;
      output[o++] =
        alphabet[((output[i - 3]! & 1) << 4) | (output[i - 2]! >> 4)]!;
      output[o++] =
        alphabet[((output[i - 2]! & 15) << 1) | (output[i - 1]! >> 7)]!;
      output[o++] = alphabet[(output[i - 1]! >> 2) & 31]!;
      output[o++] = alphabet[(output[i - 1]! & 3) << 3]!;
      output[o++] = padding;
      break;
  }

  return output;
}

export function decodeBase32(input: string): Uint8Array_ {
  return decodeRawBase32(
    new TextEncoder().encode(input) as Uint8Array_,
  );
}

export function decodeRawBase32(
  input: Uint8Array_,
): Uint8Array_ {
  switch (input.length % 8) {
    case 6:
    case 3:
    case 1:
      throw new TypeError("Invalid Character");
  }
  if (input[input.length - 6] === padding) {
    assertIsPadding(input.subarray(input.length - 6));
    input = input.subarray(0, input.length - 6);
  } else if (input[input.length - 4] === padding) {
    assertIsPadding(input.subarray(input.length - 4));
    input = input.subarray(0, input.length - 4);
  } else if (input[input.length - 3] === padding) {
    assertIsPadding(input.subarray(input.length - 3));
    input = input.subarray(0, input.length - 3);
  } else if (input[input.length - 1] === padding) {
    input = input.subarray(0, input.length - 1);
  }

  let i = 7;
  let o = 0;
  for (; i < input.length; i += 8) {
    input[i - 7] = offsetByte(input[i - 7]!);
    input[i - 6] = offsetByte(input[i - 6]!);
    input[i - 5] = offsetByte(input[i - 5]!);
    input[i - 4] = offsetByte(input[i - 4]!);
    input[i - 3] = offsetByte(input[i - 3]!);
    input[i - 2] = offsetByte(input[i - 2]!);
    input[i - 1] = offsetByte(input[i - 1]!);
    input[i] = offsetByte(input[i]!);
    input[o++] = (input[i - 7]! << 3) | (input[i - 6]! >> 2);
    input[o++] = ((input[i - 6]! & 3) << 6) | (input[i - 5]! << 1) |
      (input[i - 4]! >> 4);
    input[o++] = ((input[i - 4]! & 15) << 4) | (input[i - 3]! >> 1);
    input[o++] = ((input[i - 3]! & 1) << 7) | (input[i - 2]! << 2) |
      (input[i - 1]! >> 3);
    input[o++] = ((input[i - 1]! & 3) << 5) | input[i]!;
  }
  switch (i) {
    case input.length + 5:
      input[i - 7] = offsetByte(input[i - 7]!);
      input[i - 6] = offsetByte(input[i - 6]!);
      input[o++] = (input[i - 7]! << 3) | (input[i - 6]! >> 2);
      break;
    case input.length + 3:
      input[i - 7] = offsetByte(input[i - 7]!);
      input[i - 6] = offsetByte(input[i - 6]!);
      input[i - 5] = offsetByte(input[i - 5]!);
      input[i - 4] = offsetByte(input[i - 4]!);
      input[o++] = (input[i - 7]! << 3) | (input[i - 6]! >> 2);
      input[o++] = ((input[i - 6]! & 3) << 6) | (input[i - 5]! << 1) |
        (input[i - 4]! >> 4);
      break;
    case input.length + 2:
      input[i - 7] = offsetByte(input[i - 7]!);
      input[i - 6] = offsetByte(input[i - 6]!);
      input[i - 5] = offsetByte(input[i - 5]!);
      input[i - 4] = offsetByte(input[i - 4]!);
      input[i - 3] = offsetByte(input[i - 3]!);
      input[o++] = (input[i - 7]! << 3) | (input[i - 6]! >> 2);
      input[o++] = ((input[i - 6]! & 3) << 6) | (input[i - 5]! << 1) |
        (input[i - 4]! >> 4);
      input[o++] = ((input[i - 4]! & 15) << 4) | (input[i - 3]! >> 1);
      break;
    case input.length:
      input[i - 7] = offsetByte(input[i - 7]!);
      input[i - 6] = offsetByte(input[i - 6]!);
      input[i - 5] = offsetByte(input[i - 5]!);
      input[i - 4] = offsetByte(input[i - 4]!);
      input[i - 3] = offsetByte(input[i - 3]!);
      input[i - 2] = offsetByte(input[i - 2]!);
      input[i - 1] = offsetByte(input[i - 1]!);
      input[o++] = (input[i - 7]! << 3) | (input[i - 6]! >> 2);
      input[o++] = ((input[i - 6]! & 3) << 6) | (input[i - 5]! << 1) |
        (input[i - 4]! >> 4);
      input[o++] = ((input[i - 4]! & 15) << 4) | (input[i - 3]! >> 1);
      input[o++] = ((input[i - 3]! & 1) << 7) | (input[i - 2]! << 2) |
        (input[i - 1]! >> 3);
      break;
  }

  return input.subarray(0, o);
}

function assertIsPadding(input: Uint8Array_) {
  for (let i = 0; i < input.length; ++i) {
    if (input[i] !== padding) throw new TypeError("Invalid Character");
  }
}

function offsetByte(byte: number): number {
  if (
    !((65 <= byte && byte <= 90) ||
      (50 <= byte && byte <= 55))
  ) throw new TypeError("Invalid Character");
  return rAlphabet[byte]!;
}
