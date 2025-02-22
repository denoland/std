// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4 | base64}
 * encoding and decoding.
 *
 * ```ts
 * import {
 *   encodeBase64,
 *   decodeBase64,
 * } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert";
 *
 * const foobar = new TextEncoder().encode("foobar");
 *
 * assertEquals(encodeBase64(foobar), "Zm9vYmFy");
 * assertEquals(decodeBase64("Zm9vYmFy"), foobar);
 * ```
 *
 * @module
 */

import {
  decodeBase64 as decode,
  encodeBase64 as encode,
} from "./unstable_base64.ts";
/**
 * Converts data into a base64-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @param data The data to encode.
 * @returns The base64-encoded string.
 *
 * @example Usage
 * ```ts
 * import { encodeBase64 } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(encodeBase64("foobar"), "Zm9vYmFy");
 * ```
 */
export function encodeBase64(input: string | Uint8Array | ArrayBuffer): string {
  if (typeof input === "string") {
    return encode(input);
  } else if (input instanceof ArrayBuffer) {
    return encode(new Uint8Array(input).slice());
  }
  return encode(input.slice());
}

/**
 * Decodes a base64-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 *
 * @param b64 The base64-encoded string to decode.
 * @returns The decoded data.
 *
 * @example Usage
 * ```ts
 * import { decodeBase64 } from "@std/encoding/base64";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   decodeBase64("Zm9vYmFy"),
 *   new TextEncoder().encode("foobar")
 * );
 * ```
 */
export function decodeBase64(input: string): Uint8Array<ArrayBuffer> {
  return decode(input);
}
