// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { arrayToNumber } from "./_common.ts";
import { CborTag } from "./tag.ts";
import type { CborType } from "./types.ts";

export function decode(source: number[]): CborType {
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

export function decodeZero(source: number[], aI: number): number | bigint {
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

export function decodeOne(source: number[], aI: number): number | bigint {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const x = decodeZero(source, aI);
  if (typeof x === "bigint") return -x - 1n;
  return -x - 1;
}

export function decodeTwo(source: number[], aI: number): Uint8Array {
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

export function decodeThree(source: number[], aI: number): string {
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

export function decodeFour(source: number[], aI: number): CborType[] {
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

export function decodeFive(
  source: number[],
  aI: number,
): { [k: string]: CborType } {
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

export function decodeSix(
  source: number[],
  aI: number,
): Date | Map<CborType, CborType> | CborTag<CborType> {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b110_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const tagNumber = decodeZero(source, aI);
  switch (BigInt(tagNumber)) {
    case 0n: {
      const tagContent = decode(source);
      if (typeof tagContent !== "string") {
        throw new TypeError('Invalid TagItem: Expected a "text string"');
      }
      return new Date(tagContent);
    }
    case 1n: {
      const tagContent = decode(source);
      if (typeof tagContent !== "number" && typeof tagContent !== "bigint") {
        throw new TypeError(
          'Invalid TagItem: Expected a "integer" or "float"',
        );
      }
      return new Date(Number(tagContent) * 1000);
    }
    case 259n:
      return decodeMap(source);
  }
  return new CborTag(tagNumber, decode(source));
}

export function decodeSeven(
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

function decodeMap(source: number[]): Map<CborType, CborType> {
  const byte = source.pop();
  if (byte == undefined) throw new RangeError("More bytes were expected");

  const majorType = byte >> 5;
  if (majorType !== 5) throw new TypeError('Invalid TagItem: Expected a "map"');
  const aI = byte & 0b000_11111;
  if (aI <= 27) {
    const map = new Map<CborType, CborType>();
    // Can safely assume `source.length < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    // 2 ** 53 is the tipping point where integers loose precision.
    const len = Number(decodeZero(source, aI));
    for (let i = 0; i < len; ++i) {
      const key = decode(source);
      if (map.has(key)) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${key}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      map.set(key, decode(source));
    }
    return map;
  }
  if (aI === 31) {
    const map = new Map<CborType, CborType>();
    if (!source.length) throw new RangeError("More bytes were expected");
    while (source[source.length - 1] !== 0b111_11111) {
      const key = decode(source);
      if (map.has(key)) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${key}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      map.set(key, decode(source));
      if (!source.length) throw new RangeError("More bytes were expected");
    }
    source.pop();
    return map;
  }
  throw new RangeError(
    `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
  );
}
