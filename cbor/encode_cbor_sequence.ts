// Copyright 2018-2025 the Deno authors. MIT license.

import { calcEncodingSize, encode } from "./_common_encode.ts";
import type { CborType } from "./types.ts";

/**
 * Encodes an array of {@link CborType} values into a CBOR format sequence
 * represented as a {@link Uint8Array}.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { type CborType, decodeCborSequence, encodeCborSequence } from "@std/cbor";
 *
 * const rawMessage = [
 *   "Hello World",
 *   35,
 *   0.5,
 *   false,
 *   -1,
 *   null,
 *   Uint8Array.from([0, 1, 2, 3]),
 *   new Date(),
 *   new Map<CborType, CborType>([[1, 2], ['3', 4], [[5], { a: 6 }]]),
 * ];
 *
 * const encodedMessage = encodeCborSequence(rawMessage);
 * const decodedMessage = decodeCborSequence(encodedMessage);
 *
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param values An array of values to encode of type {@link CborType}
 * @returns A {@link Uint8Array} representing the encoded data.
 */
export function encodeCborSequence(values: CborType[]): Uint8Array {
  let x = 0;
  for (const value of values) x += calcEncodingSize(value);
  const output = new Uint8Array(x);

  x = 0;
  for (const value of values) x = encode(value, output, x);
  return output;
}
