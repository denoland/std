// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) 2014 Jameson Little. MIT License.

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
 * import { decodeBase32Hex } from "@std/encoding/base32hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase32Hex("6PHJCC3360======"),
 *   new TextEncoder().encode("6c60c0"),
 * );
 * ```
 *
 * @experimental
 */

import { decode, encode } from "./_base32_common.ts";

const lookup: string[] = "0123456789ABCDEFGHIJKLMNOPQRSTUV".split("");
const revLookup: number[] = [];
lookup.forEach((c, i) => revLookup[c.charCodeAt(0)] = i);

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
 * import { encodeBase32Hex } from "@std/encoding/base32hex";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase32Hex("6c60c0"), "6PHJCC3360======");
 * ```
 *
 * @experimental
 */
export function encodeBase32Hex(
  data: ArrayBuffer | Uint8Array | string,
): string {
  return encode(data, lookup);
}
