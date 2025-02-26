// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.crockford.com/base32.html | Crockford base32}
 * encoding and decoding.
 *
 * Modified from @std/encoding/base32.
 *
 * ```ts
 * import { encodeBase32Crockford, decodeBase32Crockford } from "@std/encoding/unstable-base32crockford";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32Crockford("foobar"), "CSQPYRK1E8======");
 *
 * assertEquals(
 *   decodeBase32Crockford("CSQPYRK1E8======"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common32.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder()
  .encode("0123456789ABCDEFGHJKMNPQRSTVWXYZ");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

/**
 * Converts data into a Crockford base32-encoded string.
 *
 * @see {@link https://www.crockford.com/base32.html}
 *
 * @param input The data to encode.
 * @returns The Crockford base32-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase32Crockford } from "@std/encoding/unstable-base32crockford";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32Crockford("foobar"), "CSQPYRK1E8======");
 * ```
 */
export function encodeBase32Crockford(
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

export function encodeRawBase32Crockford(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  return encode(buffer, i, o, alphabet, padding);
}

/**
 * Decodes a Crockford base32-encoded string.
 *
 * @see {@link https://www.crockford.com/base32.html}
 *
 * @param input The Crockford Base32-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase32Crockford } from "@std/encoding/unstable-base32crockford";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase32Crockford("CSQPYRK1E8======"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 */
export function decodeBase32Crockford(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
}

export function decodeRawBase32Crockford(
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
    !((48 <= byte && byte <= 57) ||
      (65 <= byte && byte <= 72) ||
      byte == 74 ||
      byte == 75 ||
      byte == 77 ||
      byte == 78 ||
      (80 <= byte && byte <= 84) ||
      (86 <= byte && byte <= 90))
  ) throw new TypeError("Invalid Character");
}
