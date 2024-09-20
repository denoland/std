// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { numberToArray } from "./_common.ts";
import type { CborInputStream } from "./encode_stream.ts";
import type { CborOutputStream } from "./decode_stream.ts";

/**
 * This type specifies the primitive types that the implementation can
 * encode/decode into/from.
 */
export type CborPrimitiveType =
  | undefined
  | null
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | Date;

/**
 * This type specifies the encodable and decodable values for {@link encodeCbor}
 * and {@link decodeCbor}.
 */
export type CborType = CborPrimitiveType | CborTag<CborType> | CborType[] | {
  [k: string]: CborType;
};

/**
 * A class that wraps {@link CborType}, {@link CborInputStream}, and {@link CborOutputStream} values,
 * assuming the `tagContent` is the appropriate type and format for encoding.
 * A list of the different types can be found
 * [here](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
 *
 * This class will be returned out of {@link decodeCbor} if it doesn't automatically
 * know how to handle the tag number.
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
 * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
 *
 * const rawMessage = new TextEncoder().encode("Hello World");
 *
 * const encodedMessage = encodeCbor(
 *   new CborTag(
 *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
 *     encodeBase64Url(rawMessage),
 *   ),
 * );
 * const decodedMessage = decodeCbor(encodedMessage);
 * assert(decodedMessage instanceof CborTag);
 * assert(typeof decodedMessage.tagContent === "string");
 * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
 * ```
 *
 * @typeParam T extends {@link CborType} | {@link CborInputStream} | {@link CborOutputStream}
 */
export class CborTag<T extends CborType | CborInputStream | CborOutputStream> {
  /**
   * The number indicating how the tagContent should be interpreted based off
   * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encodeCbor(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   * const decodedMessage = decodeCbor(encodedMessage);
   * assert(decodedMessage instanceof CborTag);
   * assert(typeof decodedMessage.tagContent === "string");
   * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
   * ```
   */
  tagNumber: number | bigint;
  /**
   * The content wrapped around the tagNumber indicating how it should be
   * interpreted based off
   * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encodeCbor(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   * const decodedMessage = decodeCbor(encodedMessage);
   * assert(decodedMessage instanceof CborTag);
   * assert(typeof decodedMessage.tagContent === "string");
   * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
   * ```
   */
  tagContent: T;
  /**
   * Constructs a new instance.
   * @param tagNumber The value to tag the {@link CborType} with.
   * @param tagContent The {@link CborType} or {@link CborInputStream} formatted to the correct semantics.
   */
  constructor(tagNumber: number | bigint, tagContent: T) {
    this.tagNumber = tagNumber;
    this.tagContent = tagContent;
  }
}

/**
 * A function to encode JavaScript values into the CBOR format based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { decodeCbor, encodeCbor } from "@std/cbor";
 *
 * const rawMessage = [
 *   "Hello World",
 *   35,
 *   0.5,
 *   false,
 *   -1,
 *   null,
 *   Uint8Array.from([0, 1, 2, 3]),
 * ];
 *
 * const encodedMessage = encodeCbor(rawMessage);
 * const decodedMessage = decodeCbor(encodedMessage);
 *
 * assert(decodedMessage instanceof Array);
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param value Value to encode to CBOR format.
 * @returns Encoded CBOR data.
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
  return encodeObject(value);
}

function encodeNumber(x: number): Uint8Array {
  if (x % 1 === 0) {
    const isNegative = x < 0;
    const majorType = isNegative ? 0b001_00000 : 0b000_00000;
    if (isNegative) x = -x - 1;

    if (x < 24) return new Uint8Array([majorType + x]);
    if (x < 2 ** 8) return new Uint8Array([majorType + 24, x]);
    if (x < 2 ** 16) {
      return concat([new Uint8Array([majorType + 25]), numberToArray(2, x)]);
    }
    if (x < 2 ** 32) {
      return concat([new Uint8Array([majorType + 26]), numberToArray(4, x)]);
    }
    if (x < 2 ** 64) {
      // Due to possible precision loss with numbers this large, it's best to do conversion under BigInt or end up with 1n off.
      return encodeBigInt(BigInt(isNegative ? -x - 1 : x));
    }
    throw new RangeError(
      `Cannot encode number: It (${isNegative ? -x - 1 : x}) exceeds ${
        isNegative ? "-" : ""
      }2 ** 64 - 1`,
    );
  }
  return concat([new Uint8Array([0b111_11011]), numberToArray(8, x)]);
}

function encodeBigInt(x: bigint): Uint8Array {
  const isNegative = x < 0n;
  if ((isNegative ? -x : x) < 2n ** 32n) return encodeNumber(Number(x));

  const head = new Uint8Array([x < 0n ? 0b001_11011 : 0b000_11011]);
  if (isNegative) x = -x - 1n;

  if (x < 2n ** 64n) return concat([head, numberToArray(8, x)]);
  throw new RangeError(
    `Cannot encode bigint: It (${isNegative ? -x - 1n : x}) exceeds ${
      isNegative ? "-" : ""
    }2 ** 64 - 1`,
  );
}

function encodeUint8Array(x: Uint8Array): Uint8Array {
  if (x.length < 24) {
    return concat([new Uint8Array([0b010_00000 + x.length]), x]);
  }
  if (x.length < 2 ** 8) {
    return concat([new Uint8Array([0b010_11000, x.length]), x]);
  }
  if (x.length < 2 ** 16) {
    return concat([
      new Uint8Array([0b010_11001]),
      numberToArray(2, x.length),
      x,
    ]);
  }
  if (x.length < 2 ** 32) {
    return concat([
      new Uint8Array([0b010_11010]),
      numberToArray(4, x.length),
      x,
    ]);
  }
  // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support a `Uint8Array` being that large.
  return concat([
    new Uint8Array([0b010_11011]),
    numberToArray(8, x.length),
    x,
  ]);
}

function encodeString(x: string): Uint8Array {
  const array = encodeUint8Array(new TextEncoder().encode(x));
  array[0]! += 1 << 5;
  return array;
}

function encodeDate(x: Date): Uint8Array {
  return concat([
    new Uint8Array([0b110_00001]),
    encodeNumber(x.getTime() / 1000),
  ]);
}

function encodeArray(x: CborType[]): Uint8Array {
  let head: number[];
  if (x.length < 24) head = [0b100_00000 + x.length];
  else if (x.length < 2 ** 8) head = [0b100_11000, x.length];
  else if (x.length < 2 ** 16) {
    head = [0b100_11001, ...numberToArray(2, x.length)];
  } else if (x.length < 2 ** 32) {
    head = [0b100_11010, ...numberToArray(4, x.length)];
  } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support an `Array` being that large.
  else head = [0b100_11011, ...numberToArray(8, x.length)];
  return concat([Uint8Array.from(head), ...x.map((x) => encodeCbor(x))]);
}

function encodeObject(x: { [k: string]: CborType }): Uint8Array {
  const len = Object.keys(x).length;
  let head: number[];
  if (len < 24) head = [0b101_00000 + len];
  else if (len < 2 ** 8) head = [0b101_11000, len];
  else if (len < 2 ** 16) head = [0b101_11001, ...numberToArray(2, len)];
  else if (len < 2 ** 32) head = [0b101_11010, ...numberToArray(4, len)];
  // Can safely assume `len < 2 ** 64` as JavaScript doesn't support an `Object` being that Large.
  else head = [0b101_11011, ...numberToArray(8, len)];
  return concat([
    Uint8Array.from(head),
    ...Object.entries(x).map((
      [k, v],
    ) => [encodeString(k), encodeCbor(v)]).flat(),
  ]);
}

function encodeTag(x: CborTag<CborType>) {
  const tagNumber = BigInt(x.tagNumber);
  if (tagNumber < 0n) {
    throw new RangeError(
      `Cannot encode Tag Item: Tag Number (${x.tagNumber}) is less than zero`,
    );
  }
  if (tagNumber > 2n ** 64n) {
    throw new RangeError(
      `Cannot encode Tag Item: Tag Number (${x.tagNumber}) exceeds 2 ** 64 - 1`,
    );
  }
  const head = encodeBigInt(tagNumber);
  head[0]! += 0b110_00000;
  return concat([head, encodeCbor(x.tagContent)]);
}
