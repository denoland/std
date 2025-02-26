// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright (c) 2014 Jameson Little. MIT License.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6 | base32}
 * encoding and decoding.
 *
 * Modified from {@link https://github.com/beatgammit/base64-js}.
 *
 * ```ts
 * import { encodeBase32, decodeBase32 } from "@std/encoding/base32";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32("foobar"), "MZXW6YTBOI======");
 *
 * assertEquals(
 *   decodeBase32("MZXW6YTBOI======"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common32.ts";
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

/**
 * Converts data into a base32-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @param input The data to encode.
 * @returns The base32-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase32 } from "@std/encoding/base32";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32("6c60c0"), "GZRTMMDDGA======");
 * ```
 */
export function encodeBase32(input: string | Uint8Array | ArrayBuffer): string {
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
  encode(output, i, 0, alphabet, padding);
  return new TextDecoder().decode(output);
}

/**
 * Decodes a base32-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 *
 * @param input The base32-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase32 } from "@std/encoding/base32";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase32("GZRTMMDDGA======"),
 *   new TextEncoder().encode("6c60c0"),
 * );
 * ```
 */
export function decodeBase32(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
}

function assertChar(byte: number): void {
  if (
    !((65 <= byte && byte <= 90) ||
      (50 <= byte && byte <= 55))
  ) throw new TypeError("Invalid Character");
}
