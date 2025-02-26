// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common64.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

export function encodeBase64Url(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const [output, i] = detach(input, calcMax(input.length));
  let o = encode(output, i, 0, alphabet, padding);
  o = output.indexOf(padding, o - 2);
  return new TextDecoder().decode(o > 0 ? output.subarray(0, o) : output);
}

export function encodeRawBase64Url(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  o = encode(buffer, i, o, alphabet, padding);
  i = buffer.indexOf(padding, o - 2);
  return o - 2 <= i && i < o ? i : o;
}

export function decodeBase64Url(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
}

export function decodeRawBase64Url(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  if (i < o) {
    throw new RangeError(
      "Input (i) must be greater than or equal to output (o)",
    );
  }
  return decode(buffer, i, o, rAlphabet, padding, assertChar);
}

function assertChar(byte: number): void {
  if (
    !((65 <= byte && byte <= 90) ||
      (97 <= byte && byte <= 122) ||
      (48 <= byte && byte <= 57) ||
      byte === 45 ||
      byte === 95)
  ) throw new TypeError("Invalid Character");
}
