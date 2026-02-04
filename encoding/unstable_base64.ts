// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions to encode and decode to and from base64 strings.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase64, type Uint8Array_ } from "@std/encoding/unstable-base64";
 *
 * assertEquals(encodeBase64("Hello World", { alphabet: "base64" }), "SGVsbG8gV29ybGQ=");
 * assertEquals(
 *   encodeBase64(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base64" }
 *   ),
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
import {
  alphabet,
  type Base64Alphabet,
  type Base64Options,
  calcSizeBase64,
  decode,
  encode,
  padding,
  rAlphabet,
} from "./_common64.ts";
export { type Base64Alphabet, type Base64Options, calcSizeBase64 };
import { detach } from "./_common_detach.ts";

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
 * @param options The options to use for encoding.
 * @returns The base64 string representation of the input.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   encodeBase64,
 *   type Uint8Array_
 * } from "@std/encoding/unstable-base64";
 *
 * assertEquals(encodeBase64("Hello World"), "SGVsbG8gV29ybGQ=");
 * assertEquals(
 *   encodeBase64(new TextEncoder().encode("Hello World") as Uint8Array_),
 *   "SGVsbG8gV29ybGQ=",
 * );
 *
 * assertEquals(
 *   encodeBase64("Hello World", { alphabet: "base64url" }),
 *   "SGVsbG8gV29ybGQ",
 * );
 * assertEquals(
 *   encodeBase64(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base64url" },
 *   ),
 *   "SGVsbG8gV29ybGQ",
 * );
 * ```
 */
export function encodeBase64(
  input: string | Uint8Array_ | ArrayBuffer,
  options: Base64Options = {},
): string {
  options.alphabet ??= "base64";
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  let [output, i] = detach(
    input as Uint8Array_,
    calcSizeBase64((input as Uint8Array_).length),
  );
  let o = encode(output, i, 0, alphabet[options.alphabet], padding);
  if (options.alphabet === "base64url") {
    o = output.indexOf(padding, o - 2);
    if (o > 0) output = output.subarray(0, o);
  }
  return new TextDecoder().decode(output);
}

/**
 * `encodeIntoBase64` takes an input source and encodes it as base64 into the
 * output buffer.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input the source to encode.
 * @param output the buffer to write the encoded source to.
 * @param options the options to use for encoding.
 * @returns the number of bytes written to the buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   calcSizeBase64,
 *   encodeBase64,
 *   encodeIntoBase64,
 * } from "@std/encoding/unstable-base64";
 *
 * const prefix = "data:url/fake,";
 * const input = await Deno.readFile("./deno.lock");
 * const output = new Uint8Array(prefix.length + calcSizeBase64(input.length));
 *
 * let o = new TextEncoder().encodeInto(prefix, output).written;
 * o += encodeIntoBase64(input, output.subarray(o), { alphabet: "base64url" });
 * assertEquals(
 *   new TextDecoder().decode(output.subarray(0, o)),
 *   "data:url/fake," +
 *     encodeBase64(
 *       await Deno.readFile("./deno.lock"),
 *       { alphabet: "base64url" },
 *     ),
 * );
 * ```
 */
export function encodeIntoBase64(
  input: string | Uint8Array_ | ArrayBuffer,
  output: Uint8Array_,
  options: Base64Options = {},
): number {
  options.alphabet ??= "base64";
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const min = calcSizeBase64((input as Uint8Array_).length);
  if (output.length < min) {
    throw new RangeError("Cannot encode input as base64: Output too small");
  }
  output = output.subarray(0, min);
  const i = min - (input as Uint8Array_).length;
  output.set(input as Uint8Array_, i);
  const o = encode(output, i, 0, alphabet[options.alphabet], padding);
  if (options.alphabet === "base64url") {
    const i = output.indexOf(padding, o - 2);
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
 * @param options The options to use for decoding.
 * @returns The decoded {@linkcode Uint8Array<ArrayBuffer>}.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { decodeBase64 } from "@std/encoding/unstable-base64";
 *
 * assertEquals(
 *   decodeBase64("SGVsbG8gV29ybGQ=", { alphabet: "base64" }),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase64("SGVsbG8gV29ybGQ", { alphabet: "base64url" }),
 *   new TextEncoder().encode("Hello World"),
 * );
 * ```
 */
export function decodeBase64(
  input: string | Uint8Array_,
  options: Base64Options = {},
): Uint8Array_ {
  options.alphabet ??= "base64";
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  }
  return input.subarray(
    0,
    decode(input, 0, 0, rAlphabet[options.alphabet], padding),
  );
}
