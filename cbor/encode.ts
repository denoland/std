// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { numberToArray } from "./_common.ts";

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
 * This type specifies the values that the implementation can encode/decode
 * into/from.
 */
export type CborType = CborPrimitiveType | CborTag | CborType[] | {
  [k: string]: CborType;
};

/**
 * A class that wraps {@link CborType} values, assuming the `tagContent` is the
 * appropriate type and format for encoding. A list of the different types can
 * be found [here](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
 *
 * This class will be returned out of CborDecoder if it doesn't automatically
 * know how to handle the tag number.
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { CborDecoder, CborEncoder, CborTag } from "@std/cbor";
 * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
 *
 * const decoder = new CborDecoder();
 * const encoder = new CborEncoder();
 *
 * const rawMessage = new TextEncoder().encode("Hello World");
 *
 * const encodedMessage = encoder.encode(
 *   new CborTag(
 *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
 *     encodeBase64Url(rawMessage),
 *   ),
 * );
 * const decodedMessage = decoder.decode(encodedMessage);
 * assert(decodedMessage instanceof CborTag);
 * assert(typeof decodedMessage.tagContent === "string");
 * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
 * ```
 */
export class CborTag {
  /**
   * The number indicating how the tagContent should be interpreted based off
   * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborDecoder, CborEncoder, CborTag } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const decoder = new CborDecoder();
   * const encoder = new CborEncoder();
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encoder.encode(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   * const decodedMessage = decoder.decode(encodedMessage);
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
   * import { CborDecoder, CborEncoder, CborTag } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const decoder = new CborDecoder();
   * const encoder = new CborEncoder();
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encoder.encode(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   * const decodedMessage = decoder.decode(encodedMessage);
   * assert(decodedMessage instanceof CborTag);
   * assert(typeof decodedMessage.tagContent === "string");
   * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
   * ```
   */
  tagContent: CborType;
  /**
   * Constructs a new instance.
   * @param tagNumber The value to tag the {@link CborType} with.
   * @param tagContent The {@link CborType} formatted to the correct semantics.
   */
  constructor(tagNumber: number | bigint, tagContent: CborType) {
    this.tagNumber = tagNumber;
    this.tagContent = tagContent;
  }
}

/**
 * A class to encode JavaScript values into the CBOR format based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * @example Usage
 * ```ts no-assert
 * import { CborEncoder } from "@std/cbor";
 *
 * const encoder = new CborEncoder();
 * console.log(encoder.encode(5));
 * ```
 */
export class CborEncoder {
  /**
   * Constructs a new instance.
   */
  constructor() {}

  /**
   * Encodes a {@link CborType} into a {@link Uint8Array}.
   * @example Usage
   * ```ts no-eval
   *
   * ```
   *
   * @param value Value to encode to CBOR format.
   * @returns Encoded CBOR data.
   */
  encode(value: CborType): Uint8Array {
    switch (typeof value) {
      case "number":
        return this.#encodeNumber(value);
      case "string":
        return this.#encodeString(value);
      case "boolean":
        return value ? this.#TRUE : this.#FALSE;
      case "undefined":
        return this.#UNDEFINED;
      case "bigint":
        return this.#encodeBigInt(value);
    }
    if (value === null) return this.#NULL;
    if (value instanceof Date) return this.#encodeDate(value);
    if (value instanceof Uint8Array) return this.#encodeUint8Array(value);
    if (value instanceof Array) return this.#encodeArray(value);
    if (value instanceof CborTag) return this.#encodeTag(value);
    return this.#encodeObject(value);
  }

  /**
   * Encodes an array of {@link CborType} into a {@link Uint8Array}.
   * @example Usage
   * ```ts no-eval
   *
   * ```
   *
   * @param array Values to encode into CBOR format.
   * @returns Encoded CBOR data.
   */
  encodeSequence(array: CborType[]): Uint8Array {
    return concat(array.map((x) => this.encode(x)));
  }

  get #UNDEFINED(): Uint8Array {
    return new Uint8Array([0b111_10111]);
  }

  get #TRUE(): Uint8Array {
    return new Uint8Array([0b111_10101]);
  }

  get #FALSE(): Uint8Array {
    return new Uint8Array([0b111_10100]);
  }

  get #NULL(): Uint8Array {
    return new Uint8Array([0b111_10110]);
  }

  #encodeNumber(x: number): Uint8Array {
    if (x % 1 === 0) {
      const majorType = x < 0 ? 0b001_00000 : 0b000_00000;
      if (x < 0) x = -x - 1;

      if (x < 24) return new Uint8Array([majorType + x]);
      if (x < 2 ** 8) return new Uint8Array([majorType + 24, x]);
      if (x < 2 ** 16) {
        return concat([new Uint8Array([majorType + 25]), numberToArray(2, x)]);
      }
      if (x < 2 ** 32) {
        return concat([new Uint8Array([majorType + 26]), numberToArray(4, x)]);
      }
      if (x < 2 ** 64) {
        return concat([new Uint8Array([majorType + 27]), numberToArray(8, x)]);
      }
      throw new RangeError(
        `Cannot encode number: It (${x}) exceeds 2 ** 64 - 1`,
      );
    }
    return concat([new Uint8Array([0b111_11011]), numberToArray(8, x)]);
  }

  #encodeBigInt(x: bigint): Uint8Array {
    if ((x < 0n ? -x : x) < 2n ** 32n) return this.#encodeNumber(Number(x));

    const head = new Uint8Array([x < 0n ? 0b010_11011 : 0b000_11011]);
    if (x < 0n) x = -x - 1n;

    if (x < 2n ** 64n) return concat([head, numberToArray(8, x)]);
    throw new RangeError(`Cannot encode bigint: It (${x}) exceeds 2 ** 64 - 1`);
  }

  #encodeString(x: string): Uint8Array {
    const array = this.#encodeUint8Array(new TextEncoder().encode(x));
    array[0]! += 1 << 5;
    return array;
  }

  #encodeUint8Array(x: Uint8Array): Uint8Array {
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

  #encodeDate(x: Date): Uint8Array {
    return concat([
      new Uint8Array([0b110_00001]),
      this.#encodeNumber(x.getTime() / 1000),
    ]);
  }

  #encodeArray(x: CborType[]): Uint8Array {
    let head: number[];
    if (x.length < 24) head = [0b100_00000 + x.length];
    else if (x.length < 2 ** 8) head = [0b100_11000, x.length];
    else if (x.length < 2 ** 16) {
      head = [0b100_11001, ...numberToArray(2, x.length)];
    } else if (x.length < 2 ** 32) {
      head = [0b100_11010, ...numberToArray(4, x.length)];
    } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support an `Array` being that large.
    else head = [0b100_11011, ...numberToArray(8, x.length)];
    return concat([Uint8Array.from(head), ...x.map((x) => this.encode(x))]);
  }

  #encodeObject(x: { [k: string]: CborType }): Uint8Array {
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
      ) => [this.#encodeString(k), this.encode(v)]).flat(),
    ]);
  }

  #encodeTag(x: CborTag): Uint8Array {
    let head: number[];
    if (x.tagNumber < 24) head = [0b110_00000 + Number(x.tagNumber)];
    else if (x.tagNumber < 2 ** 8) head = [0b110_11000, Number(x.tagNumber)];
    else if (x.tagNumber < 2 ** 16) {
      head = [0b110_11001, ...numberToArray(2, x.tagNumber)];
    } else if (x.tagNumber < 2 ** 32) {
      head = [0b110_11010, ...numberToArray(4, x.tagNumber)];
    } else if (x.tagNumber < 2 ** 64) {
      head = [0b110_11011, ...numberToArray(8, x.tagNumber)];
    } else {
      throw new RangeError(
        `Cannot encode Tag Item: Tag Number (${x.tagNumber}) exceeds 2 ** 64 - 1`,
      );
    }
    return concat([Uint8Array.from(head), this.encode(x.tagContent)]);
  }
}
