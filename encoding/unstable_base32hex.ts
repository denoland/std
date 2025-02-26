// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7 | base32hex}
 * encoding and decoding.
 *
 * Modified from {@link [base32]}.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import { encodeBase32Hex, decodeBase32Hex } from "@std/encoding/unstable-base32hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32Hex("foobar"), "CPNMUOJ1E8======");
 *
 * assertEquals(
 *   decodeBase32Hex("CPNMUOJ1E8======"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common32.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder()
  .encode("0123456789ABCDEFGHIJKLMNOPQRSTUV");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

/**
 * Converts data into a base32hex-encoded string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7}
 *
 * @param input The data to encode.
 * @returns The base32hex-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase32Hex } from "@std/encoding/unstable-base32hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32Hex("6c60c0"), "6PHJCC3360======");
 * ```
 */
export function encodeBase32Hex(
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

export function encodeRawBase32Hex(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  return encode(buffer, i, o, alphabet, padding);
}

/**
 * Decodes a base32hex-encoded string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7}
 *
 * @param input The base32hex-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase32Hex } from "@std/encoding/unstable-base32hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase32Hex("6PHJCC3360======"),
 *   new TextEncoder().encode("6c60c0"),
 * );
 * ```
 */
export function decodeBase32Hex(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
}

export function decodeRawBase32Hex(
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
      (65 <= byte && byte <= 86))
  ) throw new TypeError("Invalid Character");
}
