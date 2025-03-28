// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions to encode and decode to and from base32 strings.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32, type Uint8Array_ } from "@std/encoding/unstable-base32";
 *
 * assertEquals(encodeBase32("Hello World", "Base32"), "JBSWY3DPEBLW64TMMQ======");
 * assertEquals(
 *   encodeBase32(new TextEncoder().encode("Hello World") as Uint8Array_, "Base32"),
 *   "JBSWY3DPEBLW64TMMQ======",
 * );
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-6}
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import {
  alphabet,
  type Base32Format,
  calcSizeBase32,
  decode,
  encode,
  padding,
  rAlphabet,
} from "./_common32.ts";
export { type Base32Format, calcSizeBase32 };
import { detach } from "./_common_detach.ts";

/**
 * `encodeBase32` takes an input source and encodes it into a base32 string. If
 * a {@linkcode Uint8Array<ArrayBuffer>} or {@linkcode ArrayBuffer} is provided,
 * the underlying source will be detached and reused for the encoding. If you
 * need the input source after providing it to this function, call `.slice()` to
 * pass in a copy.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The input source to encode.
 * @param format The format to use for encoding.
 * @returns The base32 string representation of the input.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeBase32, type Uint8Array_ } from "@std/encoding/unstable-base32";
 *
 * assertEquals(encodeBase32("Hello World", "Base32"), "JBSWY3DPEBLW64TMMQ======");
 * assertEquals(
 *   encodeBase32(new TextEncoder().encode("Hello World") as Uint8Array_, "Base32"),
 *   "JBSWY3DPEBLW64TMMQ======",
 * );
 *
 * assertEquals(encodeBase32("Hello World", "Base32Hex"), "91IMOR3F41BMUSJCCG======");
 * assertEquals(
 *   encodeBase32(new TextEncoder().encode("Hello World") as Uint8Array_, "Base32Hex"),
 *   "91IMOR3F41BMUSJCCG======",
 * );
 *
 * assertEquals(encodeBase32("Hello World", "Base32Crockford"), "91JPRV3F41BPYWKCCG======");
 * assertEquals(
 *   encodeBase32(new TextEncoder().encode("Hello World") as Uint8Array_, "Base32Crockford"),
 *   "91JPRV3F41BPYWKCCG======",
 * );
 * ```
 */
export function encodeBase32(
  input: string | Uint8Array_ | ArrayBuffer,
  format: Base32Format = "Base32",
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const [output, i] = detach(
    input as Uint8Array_,
    calcSizeBase32((input as Uint8Array_).length),
  );
  encode(output, i, 0, alphabet[format], padding);
  return new TextDecoder().decode(output);
}

/**
 * `encodeIntoBase32` takes an input source and encodes it as base32 into the
 * output buffer.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input the source to encode.
 * @param output the buffer to write the encoded source to.
 * @param format the format to use for encoding.
 * @returns the number of bytes written to the buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   calcSizeBase32,
 *   encodeBase32,
 *   encodeIntoBase32,
 * } from "@std/encoding/unstable-base32";
 *
 * const prefix = "data:url/fake,";
 * const input = await Deno.readFile("./deno.lock");
 * const output = new Uint8Array(prefix.length + calcSizeBase32(input.length));
 *
 * const o = new TextEncoder().encodeInto(prefix, output).written;
 * encodeIntoBase32(input, output.subarray(o), "Base32");
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," +
 *     encodeBase32(await Deno.readFile("./deno.lock"), "Base32"),
 * );
 * ```
 */
export function encodeIntoBase32(
  input: string | Uint8Array_ | ArrayBuffer,
  output: Uint8Array_,
  format: Base32Format = "Base32",
): number {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const min = calcSizeBase32((input as Uint8Array_).length);
  if (output.length < min) {
    throw new RangeError("Cannot encode input as base32: Output too small");
  }
  output = output.subarray(0, min);
  const i = min - (input as Uint8Array_).length;
  output.set(input as Uint8Array_, i);
  return encode(output, i, 0, alphabet[format], padding);
}

/**
 * `decodeBase32` takes an input source and decodes it into a
 * {@linkcode Uint8Array<ArrayBuffer>} using the specified format. If a
 * {@linkcode Uint8Array<ArrayBuffer>} is provided as input then a subarray of
 * the input containing the decoded data is returned.
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
 * import { decodeBase32 } from "@std/encoding/unstable-base32";
 *
 * assertEquals(
 *   decodeBase32("JBSWY3DPEBLW64TMMQ======", "Base32"),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase32("91IMOR3F41BMUSJCCG======", "Base32Hex"),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase32("91JPRV3F41BPYWKCCG======", "Base32Crockford"),
 *   new TextEncoder().encode("Hello World"),
 * );
 * ```
 */
export function decodeBase32(
  input: string | Uint8Array_,
  format: Base32Format = "Base32",
): Uint8Array_ {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  }
  return input.subarray(0, decode(input, 0, 0, rAlphabet[format], padding));
}
