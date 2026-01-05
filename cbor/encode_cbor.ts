// Copyright 2018-2026 the Deno authors. MIT license.

import { calcEncodingSize, encode } from "./_common_encode.ts";
import type { CborType } from "./types.ts";

/**
 * Encodes a {@link CborType} value into a CBOR format represented as a
 * {@link Uint8Array}.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { type CborType, decodeCbor, encodeCbor } from "@std/cbor";
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
 * const encodedMessage = encodeCbor(rawMessage);
 * const decodedMessage = decodeCbor(encodedMessage);
 *
 * assert(decodedMessage instanceof Array);
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param value The value to encode of type {@link CborType}.
 * @returns A {@link Uint8Array} representing the encoded data.
 */
export function encodeCbor(value: CborType): Uint8Array {
  const output = new Uint8Array(calcEncodingSize(value));
  const o = encode(value, output, 0);
  if (o !== output.length) return output.subarray(0, o);
  return output;
}
