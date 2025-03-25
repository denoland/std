// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions to encode and decode to and from hexadecimal strings.
 *
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeHex, type Uint8Array_ } from "@std/encoding/unstable-hex";
 *
 * assertEquals(encodeHex("Hello World"), "48656c6c6f20576f726c64");
 * assertEquals(
 *   encodeHex(new TextEncoder().encode("Hello World") as Uint8Array_),
 *   "48656c6c6f20576f726c64",
 * );
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648.html#section-8}
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @module
 */

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import {
  alphabet,
  calcHexSize,
  decode,
  encode,
  rAlphabet,
} from "./_common16.ts";
export { calcHexSize };
import { detach } from "./_common_detach.ts";

/**
 * `encodeHex` takes an input source and encodes it into a hexadecimal string.
 * If a {@linkcode Uint8Array<ArrayBuffer>} or {@linkcode ArrayBuffer} is
 * provided, the underlying source will be detached and reused for the encoding.
 * If you need the input source after providing it to this function, call
 * `.slice()` to pass in a copy.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The input source to encode.
 * @returns The hexadecimal string representation of the input.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { encodeHex, type Uint8Array_ } from "@std/encoding/unstable-hex";
 *
 * assertEquals(encodeHex("Hello World"), "48656c6c6f20576f726c64");
 * assertEquals(
 *   encodeHex(new TextEncoder().encode("Hello World") as Uint8Array_),
 *   "48656c6c6f20576f726c64",
 * );
 * ```
 */
export function encodeHex(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const [output, i] = detach(
    input as Uint8Array_,
    calcHexSize((input as Uint8Array_).length),
  );
  encode(output, i, 0, alphabet);
  return new TextDecoder().decode(output);
}

/**
 * `encodeHexInto` takes an input source and encodes it as hex into the
 * output buffer.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input the source to encode.
 * @param output the buffer to write the encoded source to.
 * @returns the number of bytes written to the buffer.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   calcHexSize,
 *   encodeHex,
 *   encodeHexInto,
 * } from "@std/encoding/unstable-hex";
 *
 * const prefix = "data:url/fake,";
 * const input = await Deno.readFile("./deno.lock");
 * const output = new Uint8Array(prefix.length + calcHexSize(input.length));
 *
 * const o = new TextEncoder().encodeInto(prefix, output).written;
 * encodeHexInto(input, output.subarray(o));
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," +
 *     encodeHex(await Deno.readFile("./deno.lock")),
 * );
 * ```
 */
export function encodeHexInto(
  input: string | Uint8Array_ | ArrayBuffer,
  output: Uint8Array_,
): number {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const min = calcHexSize(input.length);
  if (output.length < min) {
    throw new RangeError("Cannot encode input as hex: Output too small");
  }
  output = output.subarray(0, min);
  const i = min - input.length;
  output.set(input, i);
  return encode(output, i, 0, alphabet);
}

/**
 * `decodeHex` takes an input source and decodes it into a
 * {@linkcode Uint8Array<ArrayBuffer>} using the specified format.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The input source to decode.
 * @returns The decoded {@linkcode Uint8Array<ArrayBuffer>}.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { decodeHex } from "@std/encoding/unstable-hex";
 *
 * assertEquals(
 *   decodeHex("48656c6c6f20576f726c64"),
 *   new TextEncoder().encode("Hello World"),
 * );
 * ```
 */
export function decodeHex(
  input: string,
): Uint8Array_ {
  const output = new TextEncoder().encode(input) as Uint8Array_;
  return output
    .subarray(0, decode(output, 0, 0, rAlphabet));
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
 * @returns The index of where the decoded data finished writing to.
 *
 * @example Basic Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import {
 *   decodeRawHex,
 *   encodeHex,
 *   type Uint8Array_,
 * } from "@std/encoding/unstable-hex";
 *
 * let buffer = new TextEncoder().encode(
 *   "data:url/fake," + encodeHex(await Deno.readFile("./deno.lock")),
 * ) as Uint8Array_;
 *
 * const i = buffer.indexOf(",".charCodeAt(0)) + 1;
 * const o = decodeRawHex(buffer, i, i);
 *
 * buffer = buffer.subarray(i, o);
 * assertEquals(buffer, await Deno.readFile("./deno.lock"));
 * ```
 */
export function decodeRawHex(
  buffer: Uint8Array_,
  i: number,
  o: number,
): number {
  if (i < o) {
    throw new RangeError(
      "Cannot decode buffer as hex: Input (i) must be greater than or equal to output (o)",
    );
  }
  return decode(buffer, i, o, rAlphabet);
}
