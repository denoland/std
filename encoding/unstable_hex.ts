// Copyright 2018-2026 the Deno authors. MIT license.
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
  calcSizeHex,
  decode,
  encode,
  rAlphabet,
} from "./_common16.ts";
export { calcSizeHex };
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
    calcSizeHex((input as Uint8Array_).length),
  );
  encode(output, i, 0, alphabet);
  return new TextDecoder().decode(output);
}

/**
 * `encodeIntoHex` takes an input source and encodes it as hex into the
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
 *   calcSizeHex,
 *   encodeHex,
 *   encodeIntoHex,
 * } from "@std/encoding/unstable-hex";
 *
 * const prefix = "data:url/fake,";
 * const input = await Deno.readFile("./deno.lock");
 * const output = new Uint8Array(prefix.length + calcSizeHex(input.length));
 *
 * const o = new TextEncoder().encodeInto(prefix, output).written;
 * encodeIntoHex(input, output.subarray(o));
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," +
 *     encodeHex(await Deno.readFile("./deno.lock")),
 * );
 * ```
 */
export function encodeIntoHex(
  input: string | Uint8Array_ | ArrayBuffer,
  output: Uint8Array_,
): number {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const min = calcSizeHex((input as Uint8Array_).length);
  if (output.length < min) {
    throw new RangeError("Cannot encode input as hex: Output too small");
  }
  output = output.subarray(0, min);
  const i = min - (input as Uint8Array_).length;
  output.set(input as Uint8Array_, i);
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
  input: string | Uint8Array_,
): Uint8Array_ {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  }
  return input.subarray(0, decode(input, 0, 0, rAlphabet));
}
