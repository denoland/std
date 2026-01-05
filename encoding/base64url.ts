// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Utilities for
 * {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5 | base64url}
 * encoding and decoding.
 *
 * @module
 */

import { calcSizeBase64, decode, encode } from "./_common64.ts";
import { detach } from "./_common_detach.ts";
import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };

const padding = "=".charCodeAt(0);
const alphabet = new TextEncoder()
  .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_");
const rAlphabet = new Uint8Array(128).fill(64); // alphabet.length
alphabet.forEach((byte, i) => rAlphabet[byte] = i);

/**
 * Convert data into a base64url-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @param data The data to encode.
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
  data: ArrayBuffer | Uint8Array | string,
): string {
  if (typeof data === "string") {
    data = new TextEncoder().encode(data) as Uint8Array_;
  } else if (data instanceof ArrayBuffer) data = new Uint8Array(data).slice();
  else data = data.slice();
  const [output, i] = detach(
    data as Uint8Array_,
    calcSizeBase64((data as Uint8Array_).length),
  );
  let o = encode(output, i, 0, alphabet, padding);
  o = output.indexOf(padding, o - 2);
  return new TextDecoder().decode(
    // deno-lint-ignore no-explicit-any
    o > 0 ? new Uint8Array((output.buffer as any).transfer(o)) : output,
  );
}

/**
 * Decodes a given base64url-encoded string.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-5}
 *
 * @param b64url The base64url-encoded string to decode.
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
export function decodeBase64Url(b64url: string): Uint8Array_ {
  const output = new TextEncoder().encode(b64url) as Uint8Array_;
  // deno-lint-ignore no-explicit-any
  return new Uint8Array((output.buffer as any)
    .transfer(decode(output, 0, 0, rAlphabet, padding)));
}
