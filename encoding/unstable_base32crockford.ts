// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014 Jameson Little. MIT License.
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
import { decode, encode } from "./_base32_common.ts";

const lookup: string[] = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".split("");
const revLookup: number[] = [];
lookup.forEach((c, i) => (revLookup[c.charCodeAt(0)] = i));

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
export function decodeBase32Crockford(b32: string): Uint8Array {
  return decode(b32, lookup);
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
  data: ArrayBuffer | Uint8Array | string,
): string {
  return encode(data, lookup);
}
