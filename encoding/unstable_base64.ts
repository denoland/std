// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions to encode and decode to and from base64 strings.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64, type Uint8Array_ } from "@std/encoding/unstable-base64";
 *
 * assertEquals(encodeBase64("Hello World", "Base64"), "SGVsbG8gV29ybGQ=");
 * assertEquals(
 *   encodeBase64(new TextEncoder().encode("Hello World") as Uint8Array_, "Base64"),
 *   "SGVsbG8gV29ybGQ=",
 * );
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-4}
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { calcMax, decode, encode } from "./_common64.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

const padding = "=".charCodeAt(0);
const alphabet: Record<Base64Format, Uint8Array> = {
  Base64: new TextEncoder()
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"),
  Base64Url: new TextEncoder()
    .encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"),
};
const rAlphabet: Record<Base64Format, Uint8Array> = {
  Base64: new Uint8Array(128).fill(64), // alphabet.Base64.length
  Base64Url: new Uint8Array(128).fill(64),
};
alphabet.Base64
  .forEach((byte, i) => rAlphabet.Base64[byte] = i);
alphabet.Base64Url
  .forEach((byte, i) => rAlphabet.Base64Url[byte] = i);

/**
 * The base 64 encoding formats.
 */
export type Base64Format = "Base64" | "Base64Url";

/**
 * `encodeBase64` takes an input source and encodes it into a base64 string. If
 * a {@linkcode Uint8Array<ArrayBuffer>} or {@linkcode ArrayBuffer} is provided,
 * the underlying source will be detached and reused for the encoding. If you
 * need the input source after providing it to this function, call `.slice()`
 * to pass in a copy.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The input source to encode.
 * @param format The format to use for encoding.
 * @returns The base64 string representation of the input.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64, type Uint8Array_ } from "@std/encoding/unstable-base64";
 *
 * assertEquals(encodeBase64("Hello World", "Base64"), "SGVsbG8gV29ybGQ=");
 * assertEquals(
 *   encodeBase64(new TextEncoder().encode("Hello World") as Uint8Array_, "Base64"),
 *   "SGVsbG8gV29ybGQ=",
 * );
 *
 * assertEquals(encodeBase64("Hello World", "Base64Url"), "SGVsbG8gV29ybGQ");
 * assertEquals(
 *   encodeBase64(new TextEncoder().encode("Hello World") as Uint8Array_, "Base64Url"),
 *   "SGVsbG8gV29ybGQ",
 * );
 * ```
 */
export function encodeBase64(
  input: string | Uint8Array_ | ArrayBuffer,
  format: Base64Format,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  let [output, i] = detach(
    input as Uint8Array_,
    calcMax((input as Uint8Array_).length),
  );
  let o = encode(output, i, 0, alphabet[format], padding);
  if (format === "Base64Url") {
    o = output.indexOf(padding, o - 2);
    if (o > 0) output = output.subarray(0, o);
  }
  return new TextDecoder().decode(output);
}

/**
 * `encodeRawBase64` is a low-level function that encodes a
 * {@linkcode Uint8Array<ArrayBuffer>} to base64 in place. The function assumes
 * that the raw data starts at param {@linkcode i} and ends at the end of the
 * buffer, and that the entire buffer provided is large enough to hold the
 * encoded data.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param buffer The buffer to encode in place.
 * @param i The index of where the raw data starts reading from.
 * @param o The index of where the encoded data starts writing to.
 * @param format The format to use for encoding.
 * @returns The index of where the encoded data finished writing to.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { calcMax, encodeBase64, encodeRawBase64 } from "@std/encoding/unstable-base64";
 *
 * const prefix = new TextEncoder().encode("data:url/fake,");
 * const input = await Deno.readFile("./deno.lock");
 *
 * const originalSize = input.length;
 * const newSize = prefix.length + calcMax(originalSize);
 * const i = newSize - originalSize;
 * const o = prefix.length;
 *
 * // deno-lint-ignore no-explicit-any
 * const output = new Uint8Array((input.buffer as any).transfer(newSize));
 * output.set(output.subarray(0, originalSize), i);
 * output.set(prefix);
 *
 * encodeRawBase64(output, i, o, "Base64");
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," + encodeBase64(await Deno.readFile("./deno.lock"), "Base64"),
 * );
 * ```
 */
export function encodeRawBase64(
  buffer: Uint8Array_,
  i: number,
  o: number,
  format: Base64Format,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  o = encode(buffer, i, o, alphabet[format], padding);
  if (format === "Base64Url") {
    i = buffer.indexOf(padding, o - 2);
    if (i > 0) return i;
  }
  return o;
}

/**
 * `decodeBase64` takes an input source and decodes it into a
 * {@linkcode Uint8Array<ArrayBuffer>} using the specified format.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The input source to decode.
 * @param format The format to use for decoding.
 * @returns The decoded {@linkcode Uint8Array<ArrayBuffer>}.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { decodeBase64 } from "@std/encoding/unstable-base64";
 *
 * assertEquals(
 *   decodeBase64("SGVsbG8gV29ybGQ=", "Base64"),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase64("SGVsbG8gV29ybGQ", "Base64Url"),
 *   new TextEncoder().encode("Hello World"),
 * );
 * ```
 */
export function decodeBase64(input: string, format: Base64Format): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(
      0,
      decode(output, 0, 0, rAlphabet[format], padding),
    );
}

/**
 * `decodeRawHex` is a low-level function that decodes a
 * {@linkcode Uint8Array<ArrayBuffer>} from hexadecimal in place. Param
 * {@linkcode i} must be greater than or equal to param {@linkcode o}. The
 * function assumes that the encoded data starts at param {@linkcode i} and ends
 * at the end of the buffer.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param buffer The buffer to decode in place.
 * @param i The index of where the encoded data starts reading from.
 * @param o The index of where the decoded data starts writing to.
 * @param format The format to use for decoding.
 * @returns The index of where the decoded data finished writing to.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   decodeRawBase64,
 *   encodeBase64,
 *   type Uint8Array_,
 * } from "@std/encoding/unstable-base64";
 *
 * let buffer = new TextEncoder().encode(
 *   "data:url/fake," + encodeBase64(await Deno.readFile("./deno.lock"), "Base64"),
 * ) as Uint8Array_;
 *
 * const i = buffer.indexOf(",".charCodeAt(0)) + 1;
 * const o = decodeRawBase64(buffer, i, i, "Base64");
 *
 * buffer = buffer.subarray(i, o);
 * assertEquals(buffer, await Deno.readFile("./deno.lock"));
 * ```
 */
export function decodeRawBase64(
  buffer: Uint8Array_,
  i: number,
  o: number,
  format: Base64Format,
): number {
  if (i < o) {
    throw new RangeError(
      "Input (i) must be greater than or equal to output (o)",
    );
  }
  return decode(buffer, i, o, rAlphabet[format], padding);
}
