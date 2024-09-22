// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { arrayToNumber } from "./_common.ts";
import { CborTag, type CborType } from "./encode.ts";

/**
 * Decodes a CBOR-encoded {@link Uint8Array} into the JavaScript equivalent
 * values represented as a {@link CborType}.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Limitations:**
 * - While CBOR does support map keys of any type, this
 * implementation only supports map keys being of type {@link string}, and will
 * throw if detected decoding otherwise.
 * - This decoder will throw if duplicate map keys are detected. This behaviour
 * differentiates from {@link CborSequenceDecoderStream}.
 *
 * **Notice:** This decoder handles the tag numbers 0, and 1 automatically, all
 * others returned are wrapped in a {@link CborTag<CborType>} instance.
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
 * @param value The value to decode of type CBOR-encoded {@link Uint8Array}.
 * @returns A {@link CborType} representing the decoded data.
 */
export function decodeCbor(value: Uint8Array): CborType {
  if (!value.length) throw RangeError("Cannot decode empty Uint8Array");
  const source = Array.from(value).reverse();
  return decode(source);
}

/**
 * Decodes a CBOR-sequence-encoded {@link Uint8Array} into the JavaScript
 * equivalent values represented as a {@link CBorType} array.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Limitations:**
 * - While CBOR does support map keys of any type, this implementation only
 * supports map keys being of type {@link string}, and will throw if detected
 * decoding otherwise.
 * - This decoder will throw an error if duplicate keys are detected.
 *
 * **Notice:** This decoder handles the tag numbers 0, and 1 automatically, all
 * others returned are wrapped in a {@link CborTag<CborType>} instance.
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { decodeCborSequence, encodeCborSequence } from "@std/cbor";
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
 * const encodedMessage = encodeCborSequence(rawMessage);
 * const decodedMessage = decodeCborSequence(encodedMessage);
 *
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param value The value to decode of type CBOR-sequence-encoded
 * {@link Uint8Array}.
 * @returns A {@link CborType} array representing the decoded data.
 */
export function decodeCborSequence(value: Uint8Array): CborType[] {
  const output: CborType[] = [];
  const source = Array.from(value).reverse();
  while (source.length) output.push(decode(source));
  return output;
}

function decode(source: number[]): CborType {
  const byte = source.pop();
  if (byte == undefined) throw new RangeError("More bytes were expected");

  const majorType = byte >> 5;
  const aI = byte & 0b000_11111;
  switch (majorType) {
    case 0:
      return decodeZero(source, aI);
    case 1:
      return decodeOne(source, aI);
    case 2:
      return decodeTwo(source, aI);
    case 3:
      return decodeThree(source, aI);
    case 4:
      return decodeFour(source, aI);
    case 5:
      return decodeFive(source, aI);
    case 6:
      return decodeSix(source, aI);
    default: // Only possible for it to be 7
      return decodeSeven(source, aI);
  }
}

function decodeZero(source: number[], aI: number): number | bigint {
  if (aI < 24) return aI;
  if (aI <= 27) {
    return arrayToNumber(
      Uint8Array.from(
        source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
      ).buffer,
      true,
    );
  }
  throw new RangeError(
    `Cannot decode value (0b000_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeOne(source: number[], aI: number): number | bigint {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const x = decodeZero(source, aI);
  if (typeof x === "bigint") return -x - 1n;
  return -x - 1;
}

function decodeTwo(source: number[], aI: number): Uint8Array {
  if (aI < 24) return Uint8Array.from(source.splice(-aI, aI).reverse());
  if (aI <= 27) {
    // Can safely assume `source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = Number(
      arrayToNumber(
        Uint8Array.from(
          source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      ),
    );
    return Uint8Array.from(source.splice(-len, len).reverse());
  }
  if (aI === 31) {
    let byte = source.pop();
    if (byte == undefined) throw new RangeError("More bytes were expected");

    const output: Uint8Array[] = [];
    while (byte !== 0b111_11111) {
      if (byte >> 5 !== 2) {
        throw new TypeError(
          `Cannot decode value (0b${(byte >> 5).toString(2).padStart(3, "0")}_${
            (byte & 0b11111).toString(2).padStart(5, "0")
          }) inside an indefinite length byte string`,
        );
      }

      const aI = byte & 0b11111;
      if (aI === 31) {
        throw new TypeError(
          "Indefinite length byte strings cannot contain indefinite length byte strings",
        );
      }

      output.push(decodeTwo(source, aI));
      byte = source.pop();
      if (byte == undefined) throw new RangeError("More bytes were expected");
    }
    return concat(output);
  }
  throw new RangeError(
    `Cannot decode value (0b010_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeThree(source: number[], aI: number): string {
  if (aI <= 27) return new TextDecoder().decode(decodeTwo(source, aI));
  if (aI === 31) {
    let byte = source.pop();
    if (byte == undefined) throw new RangeError("More bytes were expected");

    const output: string[] = [];
    while (byte !== 0b111_11111) {
      if (byte >> 5 !== 3) {
        throw new TypeError(
          `Cannot decode value (0b${(byte >> 5).toString(2).padStart(3, "0")}_${
            (byte & 0b11111).toString(2).padStart(5, "0")
          }) inside an indefinite length text string`,
        );
      }

      const aI = byte & 0b11111;
      if (aI === 31) {
        throw new TypeError(
          "Indefinite length text strings cannot contain indefinite length text strings",
        );
      }

      output.push(decodeThree(source, aI));
      byte = source.pop();
      if (byte == undefined) throw new RangeError("More bytes were expected");
    }
    return output.join("");
  }
  throw new RangeError(
    `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeFour(source: number[], aI: number): CborType[] {
  if (aI <= 27) {
    const array: CborType[] = [];
    // Can safely assume `source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = aI < 24 ? aI : Number(
      arrayToNumber(
        Uint8Array.from(
          source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      ),
    );
    for (let i = 0; i < len; ++i) array.push(decode(source));
    return array;
  }
  if (aI === 31) {
    const array: CborType[] = [];
    if (!source.length) throw new RangeError("More bytes were expected");
    while (source[source.length - 1] !== 0b111_11111) {
      array.push(decode(source));
      if (!source.length) throw new RangeError("More bytes were expected");
    }
    source.pop();
    return array;
  }
  throw new RangeError(
    `Cannot decode value (0b100_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeFive(source: number[], aI: number): { [k: string]: CborType } {
  if (aI <= 27) {
    const object: { [k: string]: CborType } = {};
    // Can safely assume `source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = aI < 24 ? aI : Number(
      arrayToNumber(
        Uint8Array.from(
          source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
        ).buffer,
        true,
      ),
    );
    for (let i = 0; i < len; ++i) {
      const key = decode(source);
      if (typeof key !== "string") {
        throw new TypeError(
          `Cannot decode key of type (${typeof key}): This implementation only supports "text string" keys`,
        );
      }

      if (object[key] !== undefined) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${key}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }

      object[key] = decode(source);
    }
    return object;
  }
  if (aI === 31) {
    const object: { [k: string]: CborType } = {};
    if (!source.length) throw new RangeError("More bytes were expected");
    while (source[source.length - 1] !== 0b111_11111) {
      const key = decode(source);
      if (typeof key !== "string") {
        throw new TypeError(
          `Cannot decode key of type (${typeof key}): This implementation only supports "text string" keys`,
        );
      }

      if (object[key] !== undefined) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${key}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }

      object[key] = decode(source);
      if (!source.length) throw new RangeError("More bytes were expected");
    }
    source.pop();
    return object;
  }
  throw new RangeError(
    `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeSix(source: number[], aI: number): Date | CborTag<CborType> {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b110_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const tagNumber = decodeZero(source, aI);
  const tagContent = decode(source);
  switch (BigInt(tagNumber)) {
    case 0n:
      if (typeof tagContent !== "string") {
        throw new TypeError('Invalid TagItem: Expected a "text string"');
      }
      return new Date(tagContent);
    case 1n:
      if (typeof tagContent !== "number" && typeof tagContent !== "bigint") {
        throw new TypeError(
          'Invalid TagItem: Expected a "integer" or "float"',
        );
      }
      return new Date(Number(tagContent) * 1000);
  }
  return new CborTag(tagNumber, tagContent);
}

function decodeSeven(
  source: number[],
  aI: number,
): undefined | null | boolean | number {
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
        source.splice(-(2 ** (aI - 24)), 2 ** (aI - 24)).reverse(),
      ).buffer,
      false,
    );
  }
  throw new RangeError(
    `Cannot decode value (0b111_${aI.toString(2).padStart(5, "0")})`,
  );
}
