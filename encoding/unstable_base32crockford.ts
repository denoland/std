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

import { decodeRawBase32, encodeRawBase32 } from "./unstable_base32.ts";

const toHex = new Uint8Array(128);
const fromHex = new Uint8Array(128);
{
  const encoder = new TextEncoder();
  const a = encoder.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=");
  const b = encoder.encode("0123456789ABCDEFGHJKMNPQRSTVWXYZ=");
  a.forEach((byte, i) => {
    toHex[byte] = b[i]!;
    fromHex[b[i]!] = byte;
  });
}

/**
 * Converts data into a Crockford base32-encoded string.
 *
 * @see {@link https://www.crockford.com/base32.html}
 *
 * @param data The data to encode.
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
  input: string | Uint8Array<ArrayBuffer> | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array<ArrayBuffer>;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawBase32Crockford(input));
}

export function encodeRawBase32Crockford(
  input: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  input = encodeRawBase32(input);
  for (let i = 0; i < input.length; ++i) input[i] = toHex[input[i]!]!;
  return input;
}

/**
 * Decodes a Crockford base32-encoded string.
 *
 * @see {@link https://www.crockford.com/base32.html}
 *
 * @param b32 The Crockford Base32-encoded string to decode.
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
export function decodeBase32Crockford(input: string): Uint8Array<ArrayBuffer> {
  return decodeRawBase32Crockford(new TextEncoder()
    .encode(input) as Uint8Array<ArrayBuffer>);
}

export function decodeRawBase32Crockford(
  input: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  for (let i = 0; i < input.length; ++i) input[i] = fromHex[input[i]!]!;
  input = decodeRawBase32(input);
  return input;
}
