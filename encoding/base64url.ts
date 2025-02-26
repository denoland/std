// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5 | base64url}
 * encoding and decoding.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common64.ts";
import { detach } from "./_common_detach.ts";

const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_");
const padding = "=".charCodeAt(0);
const rAlphabet = new Uint8Array(128);
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

/**
 * Convert data into a base64url-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @param input The data to encode.
 * @returns The base64url-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase64Url } from "@std/encoding/base64url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase64Url("foobar"), "Zm9vYmFy");
 * ```
 */
export function encodeBase64Url(
  input: string | Uint8Array | ArrayBuffer,
): string {
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
  let o = encode(output, i, 0, alphabet, padding);
  o = output.indexOf(padding, o - 2);
  return new TextDecoder().decode(o > 0 ? output.subarray(0, o) : output);
}

/**
 * Decodes a given base64url-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @param input The base64url-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase64Url } from "@std/encoding/base64url";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase64Url("Zm9vYmFy"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 */
export function decodeBase64Url(input: string): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet, padding, assertChar));
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
