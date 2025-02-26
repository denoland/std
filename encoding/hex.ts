// Copyright 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Port of the Go
 * {@link https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go | encoding/hex}
 * library.
 *
 * ```ts
 * import {
 *   decodeHex,
 *   encodeHex,
 * } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeHex("abc"), "616263");
 *
 * assertEquals(
 *   decodeHex("616263"),
 *   new TextEncoder().encode("abc"),
 * );
 * ```
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common16.ts";
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder().encode("0123456789abcdef");
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);
new TextEncoder()
  .encode("ABCDEF")
  .forEach((byte, i) => rAlphabet[byte] = i + 10);

/**
 * Converts data into a hex-encoded string.
 *
 * @param input The data to encode.
 *
 * @returns The hex-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeHex } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeHex("abc"), "616263");
 * ```
 */
export function encodeHex(input: string | Uint8Array | ArrayBuffer): string {
  let output: Uint8Array_;
  if (typeof input === "string") {
    output = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    output = new Uint8Array(input).slice();
  } else {
    output = input.slice();
  }
  let i: number;
  [output, i] = detach(output, calcMax(output.length));
  encode(output, i, 0, alphabet);
  return new TextDecoder().decode(output);
}

/**
 * Decodes the given hex-encoded string. If the input is malformed, an error is
 * thrown.
 *
 * @param input The hex-encoded string to decode.
 *
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeHex } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeHex("616263"),
 *   new TextEncoder().encode("abc"),
 * );
 * ```
 */
export function decodeHex(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, assertChar));
}

function assertChar(byte: number): void {
  if (
    !(
      (48 <= byte && byte <= 57) ||
      (97 <= byte && byte <= 102) ||
      (65 <= byte && byte <= 70)
    )
  ) throw new TypeError("Invalid Character");
}
