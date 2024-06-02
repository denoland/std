// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014 Jameson Little. MIT License.
// This module is browser compatible.

import { decode, encode } from "./utils.ts";

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7 | base32hex}
 * encoding and decoding.
 *
 * Modified from {@link base32.ts}.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import { encodeBase32Hex, decodeBase32Hex } from "@std/encoding/base32hex";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(encodeBase32Hex("foobar"), "CPNMUOJ1E8======");
 *
 * assertEquals(
 *   decodeBase32("CPNMUOJ1E8======"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 *
 * @module
 */

const lookup: string[] = "0123456789ABCDEFGHIJKLMNOPQRSTUV".split("");
const revLookup: number[] = [];
lookup.forEach((c, i) => (revLookup[c.charCodeAt(0)] = i));

/**
 * Decodes a base32hex-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7}
 *
 * @param b32 The base32hex-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase32hex } from "@std/encoding/base32hex";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(
 *   decodeBase32("GZRTMMDDGA======"),
 *   new TextEncoder().encode("6c60c0"),
 * );
 * ```
 */
export function decodeBase32Hex(b32: string): Uint8Array {
  return decode(b32, lookup);
}

/**
 * Converts data into a base32hex-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-7}
 *
 * @param data The data to encode.
 * @returns The base32hex-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase32hex } from "@std/encoding/base32hex";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(encodeBase32hex("6c60c0"), "GZRTMMDDGA======");
 * ```
 */
export function encodeBase32Hex(
  data: ArrayBuffer | Uint8Array | string
): string {
  return encode(data, lookup);
}
