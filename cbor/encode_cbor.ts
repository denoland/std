// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  encodeArray,
  encodeBigInt,
  encodeDate,
  encodeMap,
  encodeNumber,
  encodeObject,
  encodeString,
  encodeTag,
  encodeUint8Array,
} from "./_common_encode.ts";
import { CborTag } from "./tag.ts";
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
  switch (typeof value) {
    case "number":
      return encodeNumber(value);
    case "string":
      return encodeString(value);
    case "boolean":
      return new Uint8Array([value ? 0b111_10101 : 0b111_10100]);
    case "undefined":
      return new Uint8Array([0b111_10111]);
    case "bigint":
      return encodeBigInt(value);
  }
  if (value === null) return new Uint8Array([0b111_10110]);
  if (value instanceof Date) return encodeDate(value);
  if (value instanceof Uint8Array) return encodeUint8Array(value);
  if (value instanceof Array) return encodeArray(value);
  if (value instanceof CborTag) return encodeTag(value);
  if (value instanceof Map) return encodeMap(value);
  return encodeObject(value);
}
