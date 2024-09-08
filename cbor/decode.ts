// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { arrayToNumber } from "./_common.ts";
import { CborTag, type CborType } from "./encode.ts";

/**
 * A class to decode CBOR encoded {@link Uint8Array} into {@link CborType}
 * values, based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { CborDecoder, encodeCbor } from "@std/cbor";
 *
 * const decoder = new CborDecoder();
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
 * const decodedMessage = decoder.decode(encodedMessage);
 *
 * assert(decodedMessage instanceof Array);
 * assertEquals(decodedMessage, rawMessage);
 * ```
 */
export class CborDecoder {
  #source: number[] = [];
  /**
   * Constructs a new instance.
   */
  constructor() {}

  /**
   * Decodes a {@link Uint8Array} into a {@link CborType}.
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborDecoder, encodeCbor } from "@std/cbor";
   *
   * const decoder = new CborDecoder();
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
   * const decodedMessage = decoder.decode(encodedMessage);
   *
   * assert(decodedMessage instanceof Array);
   * assertEquals(decodedMessage, rawMessage);
   * ```
   *
   * @param x Value to decode from CBOR format.
   * @returns Decoded CBOR data.
   */
  decode(x: Uint8Array): CborType {
    if (!x.length) throw RangeError("Cannot decode empty Uint8Array");

    this.#source = Array.from(x).reverse();
    const y = this.#decode();
    this.#source = [];
    return y;
  }

  /**
   * Decodes an array of {@link CborType} from a {@link Uint8Array}.
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { concat } from "@std/bytes";
   * import { CborDecoder, encodeCbor } from "@std/cbor";
   *
   * const decoder = new CborDecoder();
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
   * const encodedMessage = concat(rawMessage.map(x => encodeCbor(x)))
   * const decodedMessage = decoder.decodeSequence(encodedMessage);
   *
   * assert(decodedMessage instanceof Array);
   * assertEquals(decodedMessage, rawMessage);
   * ```
   *
   * @param data Encoded data to be decoded from CBOR format.
   * @returns Decoded CBOR data.
   */
  decodeSequence(data: Uint8Array): CborType[] {
    this.#source = Array.from(data).reverse();
    const output: CborType[] = [];
    while (this.#source.length) output.push(this.#decode());
    return output;
  }

  #decode(): CborType {
    const byte = this.#source.pop();
    if (byte == undefined) throw new RangeError("More bytes were expected");

    const majorType = byte >> 5;
    const aI = byte & 0b000_11111;
    switch (majorType) {
      case 0:
        return this.#decodeZero(aI);
      case 1:
        return this.#decodeOne(aI);
      case 2:
        return this.#decodeTwo(aI);
      case 3:
        return this.#decodeThree(aI);
      case 4:
        return this.#decodeFour(aI);
      case 5:
        return this.#decodeFive(aI);
      case 6:
        return this.#decodeSix(aI);
      default: // Only possible for it to be 7
        return this.#decodeSeven(aI);
    }
  }

  #decodeZero(aI: number): number | bigint {
    if (aI < 24) return aI;
    if (aI <= 27) {
      return arrayToNumber(
        Uint8Array.from(
          this.#source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      );
    }
    throw new RangeError(
      `Cannot decode value (0b000_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  #decodeOne(aI: number): number | bigint {
    if (aI > 27) {
      throw new RangeError(
        `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
      );
    }
    const x = this.#decodeZero(aI);
    if (typeof x === "bigint") return -x - 1n;
    return -x - 1;
  }

  #decodeTwo(aI: number): Uint8Array {
    if (aI < 24) return Uint8Array.from(this.#source.splice(-aI, aI).reverse());
    if (aI <= 27) {
      // Can safely assume `this.#source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
      // 2 ** 53 is the tipping point where integers loose precision.
      const len = Number(
        arrayToNumber(
          Uint8Array.from(
            this.#source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
          ).buffer,
          true,
        ),
      );
      return Uint8Array.from(this.#source.splice(-len, len).reverse());
    }
    if (aI === 31) {
      let byte = this.#source.pop();
      if (byte == undefined) throw new RangeError("More bytes were expected");

      const output: Uint8Array[] = [];
      while (byte !== 0b111_11111) {
        if (byte >> 5 === 2) {
          if ((byte & 0b11111) !== 31) {
            output.push(this.#decodeTwo(byte & 0b11111));
          } else {
            throw new TypeError(
              "Indefinite length byte strings cannot contain indefinite length byte strings",
            );
          }
        } else {
          throw new TypeError(
            `Cannot decode value (b${
              (byte >> 5).toString(2).padStart(3, "0")
            }_${
              (byte & 0b11111).toString(2).padStart(5, "0")
            }) inside an indefinite length byte string`,
          );
        }

        byte = this.#source.pop();
        if (byte == undefined) throw new RangeError("More bytes were expected");
      }
      return concat(output);
    }
    throw new RangeError(
      `Cannot decode value (0b010_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  #decodeThree(aI: number): string {
    if (aI > 27) {
      if (aI === 31) {
        let byte = this.#source.pop();
        if (byte == undefined) throw new RangeError("More bytes were expected");

        const output: string[] = [];
        while (byte !== 0b111_11111) {
          if (byte >> 5 === 2) {
            if ((byte & 0b11111) !== 31) {
              output.push(this.#decodeThree(byte & 0b11111));
            } else {
              throw new TypeError(
                "Indefinite length text strings cannot contain indefinite length text strings",
              );
            }
          } else {
            throw new TypeError(
              `Cannot decode value (b${
                (byte >> 5).toString(2).padStart(3, "0")
              }_${
                (byte & 0b11111).toString(2).padStart(5, "0")
              }) inside an indefinite length text string`,
            );
          }
          byte = this.#source.pop();
          if (byte == undefined) {
            throw new RangeError("More bytes were expected");
          }
        }
        return output.join("");
      }
      throw new RangeError(
        `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
      );
    }
    return new TextDecoder().decode(this.#decodeTwo(aI));
  }

  #decodeFour(aI: number): CborType[] {
    if (aI > 27) {
      if (aI === 31) {
        const array: CborType[] = [];
        while (this.#source[this.#source.length - 1] !== 0b111_11111) {
          array.push(this.#decode());
        }
        this.#source.pop();
        return array;
      }
      throw new RangeError(
        `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
      );
    }
    const array: CborType[] = [];
    // Can safely assume `this.#source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = aI < 24 ? aI : Number(
      arrayToNumber(
        Uint8Array.from(
          this.#source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      ),
    );
    for (let i = 0; i < len; ++i) array.push(this.#decode());
    return array;
  }

  #decodeFive(aI: number): { [k: string]: CborType } {
    if (aI > 27) {
      if (aI === 31) {
        const object: { [k: string]: CborType } = {};
        while (this.#source[this.#source.length - 1] !== 0b111_11111) {
          const key = this.#decode();
          if (typeof key !== "string") {
            throw new TypeError(
              `Cannot decode key of type "${typeof key}": This implementation only support "text string" keys`,
            );
          }
          if (object[key] !== undefined) {
            throw new TypeError(
              `A Map cannot have duplicate keys: Key (${key}) already exists`,
            ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
          }
          object[key] = this.#decode();
        }
        return object;
      }
      throw new RangeError(
        `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
      );
    }
    const object: { [k: string]: CborType } = {};
    // Can safely assume `this.#source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = aI < 24 ? aI : Number(
      arrayToNumber(
        Uint8Array.from(
          this.#source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      ),
    );
    for (let i = 0; i < len; ++i) {
      const key = this.#decode();
      if (typeof key !== "string") {
        throw new TypeError(
          `Cannot decode key of type "${typeof key}": This implementation only support "text string" keys`,
        );
      }
      if (object[key] !== undefined) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${key}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      object[key] = this.#decode();
    }
    return object;
  }

  #decodeSix(aI: number): Date | CborTag<CborType> {
    const tagNumber = this.#decodeZero(aI) as number;
    const tagContent = this.#decode();
    switch (tagNumber) {
      case 0:
        if (typeof tagContent !== "string") {
          throw new TypeError('Invalid TagItem: Expected a "text string"');
        }
        return new Date(tagContent);
      case 1:
        if (typeof tagContent !== "number" && typeof tagContent !== "bigint") {
          throw new TypeError(
            'Invalid TagItem: Expected a "integer" or "float"',
          );
        }
        return new Date(Number(tagContent) * 1000);
    }
    return new CborTag(tagNumber, tagContent);
  }

  #decodeSeven(aI: number): undefined | null | boolean | number {
    switch (aI) {
      case 20:
        return false;
      case 21:
        return true;
      case 22:
        return null;
      case 23:
        return undefined;
    }
    if (25 <= aI && aI <= 27) {
      return arrayToNumber(
        Uint8Array.from(
          this.#source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        false,
      );
    }
    throw new RangeError(
      `Cannot decode value (0b111_${aI.toString(2).padStart(5, "0")})`,
    );
  }
}
