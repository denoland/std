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
import { calcMax, decode, encode } from "./_common32.ts";
export { calcMax };
import { detach } from "./_common_detach.ts";

const padding = "=".charCodeAt(0);
const alphabet: Record<Base32Format, Uint8Array> = {
  Base32: new TextEncoder().encode("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"),
  Base32Hex: new TextEncoder().encode("0123456789ABCDEFGHIJKLMNOPQRSTUV"),
  Base32Crockford: new TextEncoder().encode("0123456789ABCDEFGHJKMNPQRSTVWXYZ"),
};
const rAlphabet: Record<Base32Format, Uint8Array> = {
  Base32: new Uint8Array(128).fill(32), // alphabet.Base32.length
  Base32Hex: new Uint8Array(128).fill(32),
  Base32Crockford: new Uint8Array(128).fill(32),
};
alphabet.Base32
  .forEach((byte, i) => rAlphabet.Base32[byte] = i);
alphabet.Base32Hex
  .forEach((byte, i) => rAlphabet.Base32Hex[byte] = i);
alphabet.Base32Crockford
  .forEach((byte, i) => rAlphabet.Base32Crockford[byte] = i);

/**
 * The base 32 encoding formats.
 */
export type Base32Format = "Base32" | "Base32Hex" | "Base32Crockford";

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
  format: Base32Format,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const [output, i] = detach(
    input as Uint8Array_,
    calcMax((input as Uint8Array_).length),
  );
  encode(output, i, 0, alphabet[format], padding);
  return new TextDecoder().decode(output);
}

/**
 * `encodeRawBase32` is a low-level function that encodes a
 * {@linkcode Uint8Array<ArrayBuffer>} to base32 in place. The function assumes
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
 * import { calcMax, encodeBase32, encodeRawBase32 } from "@std/encoding/unstable-base32";
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
 * encodeRawBase32(output, i, o, "Base32");
 * assertEquals(
 *   new TextDecoder().decode(output),
 *   "data:url/fake," + encodeBase32(await Deno.readFile("./deno.lock"), "Base32"),
 * );
 * ```
 */
export function encodeRawBase32(
  buffer: Uint8Array_,
  i: number,
  o: number,
  format: Base32Format,
): number {
  const max = calcMax(buffer.length - i);
  if (max > buffer.length - o) throw new RangeError("Buffer too small");
  return encode(buffer, i, o, alphabet[format], padding);
}

/**
 * `decodeBase32` takes an input source and decodes it into a
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
  input: string,
  format: Base32Format = "Base32",
): Uint8Array_ {
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
 *   decodeRawBase32,
 *   encodeBase32,
 *   type Uint8Array_,
 * } from "@std/encoding/unstable-base32";
 *
 * let buffer = new TextEncoder().encode(
 *   "data:url/fake," + encodeBase32(await Deno.readFile("./deno.lock"), "Base32"),
 * ) as Uint8Array_;
 *
 * const i = buffer.indexOf(",".charCodeAt(0)) + 1;
 * const o = decodeRawBase32(buffer, i, i, "Base32");
 *
 * buffer = buffer.subarray(i, o);
 * assertEquals(buffer, await Deno.readFile("./deno.lock"));
 * ```
 */
export function decodeRawBase32(
  buffer: Uint8Array_,
  i: number,
  o: number,
  format: Base32Format = "Base32",
): number {
  if (i < o) {
    throw new RangeError(
      "Input (i) must be greater than or equal to output (o)",
    );
  }
  return decode(buffer, i, o, rAlphabet[format], padding);
}
