// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions to encode and decode to and from base32 strings.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   encodeBase32,
 *   type Uint8Array_
 * } from "@std/encoding/unstable-base32";
 *
 * assertEquals(
 *   encodeBase32("Hello World", { alphabet: "base32" }),
 *   "JBSWY3DPEBLW64TMMQ======",
 * );
 * assertEquals(
 *   encodeBase32(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base32" },
 *   ),
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
  type Base32Alphabet,
  type Base32Options,
  calcSizeBase32,
  decode,
  encode,
  padding,
  rAlphabet,
} from "./_common32.ts";
export { type Base32Alphabet, type Base32Options, calcSizeBase32 };
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
 * @param options The options to use for encoding.
 * @returns The base32 string representation of the input.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   encodeBase32,
 *   type Uint8Array_,
 * } from "@std/encoding/unstable-base32";
 *
 * assertEquals(
 *   encodeBase32("Hello World", { alphabet: "base32" }),
 *   "JBSWY3DPEBLW64TMMQ======",
 * );
 * assertEquals(
 *   encodeBase32(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base32" },
 *   ),
 *   "JBSWY3DPEBLW64TMMQ======",
 * );
 *
 * assertEquals(
 *   encodeBase32("Hello World", { alphabet: "base32hex" }),
 *   "91IMOR3F41BMUSJCCG======",
 * );
 * assertEquals(
 *   encodeBase32(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base32hex" },
 *   ),
 *   "91IMOR3F41BMUSJCCG======",
 * );
 *
 * assertEquals(
 *   encodeBase32("Hello World", { alphabet: "base32crockford" }),
 *   "91JPRV3F41BPYWKCCG======",
 * );
 * assertEquals(
 *   encodeBase32(
 *     new TextEncoder().encode("Hello World") as Uint8Array_,
 *     { alphabet: "base32crockford" },
 *   ),
 *   "91JPRV3F41BPYWKCCG======",
 * );
 * ```
 */
export function encodeBase32(
  input: string | Uint8Array_ | ArrayBuffer,
  options: Base32Options = {},
): string {
  options.alphabet ??= "base32";
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const [output, i] = detach(
    input as Uint8Array_,
    calcSizeBase32((input as Uint8Array_).length),
  );
  encode(output, i, 0, alphabet[options.alphabet], padding);
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
 * @param options the options to use for encoding.
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
 * encodeIntoBase32(input, output.subarray(o), { alphabet: "base32" });
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," +
 *     encodeBase32(await Deno.readFile("./deno.lock"), { alphabet: "base32" }),
 * );
 * ```
 */
export function encodeIntoBase32(
  input: string | Uint8Array_ | ArrayBuffer,
  output: Uint8Array_,
  options: Base32Options = {},
): number {
  options.alphabet ??= "base32";
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
  return encode(output, i, 0, alphabet[options.alphabet], padding);
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
 * @param options The options to use for decoding.
 * @returns The decoded {@linkcode Uint8Array<ArrayBuffer>}.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { decodeBase32 } from "@std/encoding/unstable-base32";
 *
 * assertEquals(
 *   decodeBase32("JBSWY3DPEBLW64TMMQ======", { alphabet: "base32"}),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase32("91IMOR3F41BMUSJCCG======", { alphabet: "base32hex"}),
 *   new TextEncoder().encode("Hello World"),
 * );
 *
 * assertEquals(
 *   decodeBase32("91JPRV3F41BPYWKCCG======", { alphabet: "base32crockford"}),
 *   new TextEncoder().encode("Hello World"),
 * );
 * ```
 */
export function decodeBase32(
  input: string | Uint8Array_,
  options: Base32Options = {},
): Uint8Array_ {
  options.alphabet ??= "base32";
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  }
  return input.subarray(
    0,
    decode(input, 0, 0, rAlphabet[options.alphabet], padding),
  );
}
