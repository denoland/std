// Copyright 2018-2026 the Deno authors. MIT license.

import { concat } from "@std/bytes";
import { CborTag } from "./tag.ts";
import type { CborType } from "./types.ts";

function calcLength(
  input: Uint8Array,
  aI: number,
  offset: number,
): [number | bigint, number] {
  if (aI < 24) return [aI, offset];
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  switch (aI) {
    case 24:
      return [view.getUint8(offset), offset + 1];
    case 25:
      return [view.getUint16(offset), offset + 2];
    case 26:
      return [view.getUint32(offset), offset + 4];
    default: // Only possible for it to be 27
      return [view.getBigUint64(offset), offset + 8];
  }
}

export function decode(input: Uint8Array, offset: number): [CborType, number] {
  const byte = input[offset++];
  if (byte == undefined) throw new RangeError("More bytes were expected");

  switch (byte >> 5) {
    case 0:
      return decodeZero(input, byte & 0b000_11111, offset);
    case 1:
      return decodeOne(input, byte & 0b000_11111, offset);
    case 2:
      return decodeTwo(input, byte & 0b000_11111, offset);
    case 3:
      return decodeThree(input, byte & 0b000_11111, offset);
    case 4:
      return decodeFour(input, byte & 0b000_11111, offset);
    case 5:
      return decodeFive(input, byte & 0b000_11111, offset);
    case 6:
      return decodeSix(input, byte & 0b000_11111, offset);
    default: // Only possible for it to be 7
      return decodeSeven(input, byte & 0b000_11111, offset);
  }
}

function decodeZero(
  input: Uint8Array,
  aI: number,
  offset: number,
): [number | bigint, number] {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b000_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  return calcLength(input, aI, offset);
}

function decodeOne(
  input: Uint8Array,
  aI: number,
  offset: number,
): [number | bigint, number] {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const output = calcLength(input, aI, offset);
  output[0] = typeof output[0] === "bigint" ? -output[0] - 1n : -output[0] - 1;
  return output;
}

function decodeTwo(
  input: Uint8Array,
  aI: number,
  offset: number,
): [Uint8Array, number] {
  if (aI < 24) return [input.subarray(offset, offset + aI), offset + aI];
  if (aI <= 27) {
    const x = calcLength(input, aI, offset);
    const start = x[1];
    const end = Number(x[0]) + x[1];
    return [input.subarray(start, end), end];
  }
  if (aI === 31) {
    let byte = input[offset++];
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
      const aI = byte & 0b000_11111;
      if (aI === 31) {
        throw new TypeError(
          "Indefinite length byte strings cannot contain indefinite length byte strings",
        );
      }
      const x = decodeTwo(input, aI, offset);
      output.push(x[0]);
      offset = x[1];
      byte = input[offset++];
      if (byte == undefined) throw new RangeError("More bytes were expected");
    }
    return [concat(output), offset + 1];
  }
  throw new RangeError(
    `Cannot decode value (0b010_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeThree(
  input: Uint8Array,
  aI: number,
  offset: number,
): [string, number] {
  if (aI < 24) {
    return [
      new TextDecoder().decode(input.subarray(offset, offset + aI)),
      offset + aI,
    ];
  }
  if (aI <= 27) {
    const x = calcLength(input, aI, offset);
    const start = x[1];
    const end = Number(x[0]) + x[1];
    return [new TextDecoder().decode(input.subarray(start, end)), end];
  }
  if (aI === 31) {
    let byte = input[offset++];
    if (byte == undefined) throw new RangeError("More bytes were expected");
    const output: Uint8Array[] = [];
    while (byte !== 0b111_11111) {
      if (byte >> 5 !== 3) {
        throw new TypeError(
          `Cannot decode value (0b${(byte >> 5).toString(2).padStart(3, "0")}_${
            (byte & 0b11111).toString(2).padStart(5, "0")
          }) inside an indefinite length text string`,
        );
      }
      const aI = byte & 0b000_11111;
      if (aI === 31) {
        throw new TypeError(
          "Indefinite length text strings cannot contain indefinite length text strings",
        );
      }
      if (aI > 27) {
        throw new RangeError(
          `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
        );
      }
      const x = decodeTwo(input, aI, offset);
      output.push(x[0]);
      offset = x[1];
      byte = input[offset++];
      if (byte == undefined) throw new RangeError("More bytes were expected");
    }
    return [new TextDecoder().decode(concat(output)), offset + 1];
  }
  throw new RangeError(
    `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeFour(
  input: Uint8Array,
  aI: number,
  offset: number,
): [CborType[], number] {
  if (aI <= 27) {
    const x = calcLength(input, aI, offset);
    // Can safely assume `x[0] < 2 ** 53` as JavaScript doesn't support an `Array` being that large.
    const length = Number(x[0]);
    offset = x[1];
    const output: CborType[] = new Array(length);
    for (let i = 0; i < length; ++i) {
      const y = decode(input, offset);
      output[i] = y[0];
      offset = y[1];
    }
    return [output, offset];
  }
  if (aI === 31) {
    const output: CborType[] = [];
    while (input[offset] !== 0b111_11111) {
      const x = decode(input, offset);
      output.push(x[0]);
      offset = x[1];
    }
    return [output, offset + 1];
  }
  throw new RangeError(
    `Cannot decode value (0b100_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeFive(
  input: Uint8Array,
  aI: number,
  offset: number,
): [{ [k: string]: CborType }, number] {
  if (aI <= 27) {
    const x = calcLength(input, aI, offset);
    // Can safely assume `x[0] < 2 ** 53` as JavaScript doesn't support an `Object` being that large.
    const length = Number(x[0]);
    offset = x[1];
    const output: { [k: string]: CborType } = {};
    for (let i = 0; i < length; ++i) {
      const y = decode(input, offset);
      if (typeof y[0] !== "string") {
        throw new TypeError(
          `Cannot decode key of type (${typeof y[
            0
          ]}): This implementation only supports "text string" keys`,
        );
      }
      if (output[y[0]] !== undefined) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${y[0]}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      const z = decode(input, y[1]);
      output[y[0]] = z[0];
      offset = z[1];
    }
    return [output, offset];
  }
  if (aI === 31) {
    const output: { [k: string]: CborType } = {};
    while (input[offset] !== 0b111_11111) {
      const x = decode(input, offset);
      if (typeof x[0] !== "string") {
        throw new TypeError(
          `Cannot decode key of type (${typeof x[
            0
          ]}): This implementation only supports "text string" keys`,
        );
      }
      if (output[x[0]] !== undefined) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${x[0]}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      const y = decode(input, x[1]);
      output[x[0]] = y[0];
      offset = y[1];
    }
    return [output, offset + 1];
  }
  throw new RangeError(
    `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
  );
}

function decodeSix(
  input: Uint8Array,
  aI: number,
  offset: number,
): [Date | bigint | Map<CborType, CborType> | CborTag<CborType>, number] {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b110_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const x = decodeZero(input, aI, offset);
  switch (BigInt(x[0])) {
    case 0n: {
      const y = decode(input, x[1]);
      if (typeof y[0] !== "string") {
        throw new TypeError('Invalid TagItem: Expected a "text string"');
      }
      return [new Date(y[0]), y[1]];
    }
    case 1n: {
      const y = decode(input, x[1]);
      if (typeof y[0] !== "number" && typeof y[0] !== "bigint") {
        throw new TypeError('Invalid TagItem: Expected a "integer" or "float"');
      }
      return [new Date(Number(y[0]) * 1000), y[1]];
    }
    case 2n: {
      const y = decode(input, x[1]);
      if (!(y[0] instanceof Uint8Array)) {
        throw new TypeError('Invalid TagItem: Expected a "byte string"');
      }
      let z = 0n;
      for (const byte of y[0]) z = (z << 8n) | BigInt(byte);
      return [z, y[1]];
    }
    case 3n: {
      const y = decode(input, x[1]);
      if (!(y[0] instanceof Uint8Array)) {
        throw new TypeError('Invalid TagItem: Expected a "byte string"');
      }
      let z = 0n;
      for (const byte of y[0]) z = (z << 8n) | BigInt(byte);
      return [-z - 1n, y[1]];
    }
    case 259n:
      return decodeMap(input, x[1]);
    default: {
      const y = decode(input, x[1]);
      return [new CborTag(x[0], y[0]), y[1]];
    }
  }
}

function decodeSeven(
  input: Uint8Array,
  aI: number,
  offset: number,
): [undefined | null | boolean | number, number] {
  switch (aI) {
    case 20:
      return [false, offset];
    case 21:
      return [true, offset];
    case 22:
      return [null, offset];
    case 23:
      return [undefined, offset];
  }
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  switch (aI) {
    case 25:
      return [view.getFloat16(offset), offset + 2];
    case 26:
      return [view.getFloat32(offset), offset + 4];
    case 27:
      return [view.getFloat64(offset), offset + 8];
    default:
      throw new RangeError(
        `Cannot decode value (0b111_${aI.toString(2).padStart(5, "0")})`,
      );
  }
}

function decodeMap(
  input: Uint8Array,
  offset: number,
): [Map<CborType, CborType>, number] {
  const byte = input[offset++];
  if (byte == undefined) throw new RangeError("More bytes were expected");
  if (byte >> 5 !== 5) throw new TypeError('Invalid TagItem: Expected a "map"');
  const aI = byte & 0b000_11111;
  if (aI <= 27) {
    const x = calcLength(input, aI, offset);
    // Can safely assume `x[0] < 2 ** 53` as JavaScript doesn't support an `Map` being that large.
    const length = Number(x[0]);
    offset = x[1];
    const output = new Map<CborType, CborType>();
    for (let i = 0; i < length; ++i) {
      const y = decode(input, offset);
      if (output.has(y[0])) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${y[0]}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      const z = decode(input, y[1]);
      output.set(y[0], z[0]);
      offset = z[1];
    }
    return [output, offset];
  }
  if (aI === 31) {
    const output = new Map<CborType, CborType>();
    while (input[offset] !== 0b111_11111) {
      const x = decode(input, offset);
      if (output.has(x[0])) {
        throw new TypeError(
          `A Map cannot have duplicate keys: Key (${x[0]}) already exists`,
        ); // https://datatracker.ietf.org/doc/html/rfc8949#name-specifying-keys-for-maps
      }
      const y = decode(input, x[1]);
      output.set(x[0], y[0]);
      offset = y[1];
    }
    return [output, offset + 1];
  }
  throw new RangeError(
    `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
  );
}
