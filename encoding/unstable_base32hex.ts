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

import { decodeRawBase32, encodeRawBase32 } from "./unstable_base32.ts";

const toHex = new Uint8Array(128);
const fromHex = new Uint8Array(128);
{
  const encoder = new TextEncoder();
  const a = encoder.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=");
  const b = encoder.encode("0123456789ABCDEFGHIJKLMNOPQRSTUV=");
  a.forEach((byte, i) => {
    toHex[byte] = b[i]!;
    fromHex[b[i]!] = byte;
  });
}

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
  input: string | Uint8Array<ArrayBuffer> | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array<ArrayBuffer>;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawBase32Hex(input));
}

export function encodeRawBase32Hex(
  input: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  input = encodeRawBase32(input);
  for (let i = 0; i < input.length; ++i) input[i] = toHex[input[i]!]!;
  return input;
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
export function decodeBase32Hex(input: string): Uint8Array<ArrayBuffer> {
  return decodeRawBase32Hex(new TextEncoder()
    .encode(input) as Uint8Array<ArrayBuffer>);
}

export function decodeRawBase32Hex(
  input: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  for (let i = 0; i < input.length; ++i) input[i] = fromHex[input[i]!]!;
  input = decodeRawBase32(input);
  return input;
}
