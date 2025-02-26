// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common32.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

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
  const [output, i] = detach(input, calcMax(input.length));
  encode(output, i, 0, alphabet, padding);
  return new TextDecoder().decode(output);
}

export function encodeRawBase32(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  return encode(buffer, i, o, alphabet, padding);
}

export function decodeBase32(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
}

export function decodeRawBase32(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  if (i < o) {
    throw new RangeError("Input (i) must be greater or equal to output (o)");
  }
  return decode(buffer, i, o, rAlphabet, padding, assertChar);
}

function assertChar(byte: number): void {
  if (
    !((65 <= byte && byte <= 90) ||
      (50 <= byte && byte <= 55))
  ) throw new TypeError("Invalid Character");
}
