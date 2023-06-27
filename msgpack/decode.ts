// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { EncodeType } from "./encode.ts";

export function decode(uint8: Uint8Array) {
  const pointer = { consumed: 0 };
  const dataView = new DataView(uint8.buffer);
  const value = decodeSlice(uint8, dataView, pointer);

  if (pointer.consumed < uint8.length) {
    throw new EvalError("Messagepack decode did not consume whole array");
  }

  return value;
}

function decodeString(
  uint8: Uint8Array,
  size: number,
  pointer: { consumed: number },
) {
  pointer.consumed += size;
  return decoder.decode(
    uint8.subarray(pointer.consumed - size, pointer.consumed),
  );
}

function decodeArray(
  uint8: Uint8Array,
  dataView: DataView,
  size: number,
  pointer: { consumed: number },
) {
  const arr: EncodeType[] = [];

  for (let i = 0; i < size; i++) {
    const value = decodeSlice(uint8, dataView, pointer);
    arr.push(value);
  }

  return arr;
}

function decodeMap(
  uint8: Uint8Array,
  dataView: DataView,
  size: number,
  pointer: { consumed: number },
) {
  const map: Record<number | string, EncodeType> = {};

  for (let i = 0; i < size; i++) {
    const key = decodeSlice(uint8, dataView, pointer);
    const value = decodeSlice(uint8, dataView, pointer);

    if (typeof key !== "number" && typeof key !== "string") {
      throw new EvalError(
        "Messagepack decode came across an invalid type for a key of a map",
      );
    }

    map[key] = value;
  }

  return map;
}

const decoder = new TextDecoder();

/**
 * Given a uint8array which contains a msgpack object,
 * return the value of the object as well as how many bytes
 * were consumed in obtaining this object
 */
function decodeSlice(
  uint8: Uint8Array,
  dataView: DataView,
  pointer: { consumed: number },
): EncodeType {
  const type = dataView.getUint8(pointer.consumed);
  pointer.consumed++;

  if (type <= 0x7f) { // positive fixint
    return type;
  }

  if (((type >> 4) ^ 0b1000) === 0) { // fixmap
    const size = type & 0xF;
    return decodeMap(uint8, dataView, size, pointer);
  }

  if (((type >> 4) ^ 0b1001) === 0) { // fixarray
    const size = type & 0xF;
    return decodeArray(uint8, dataView, size, pointer);
  }

  if (((type >> 5) ^ 0b101) === 0) { // fixstr
    const size = type & 0b00011111;
    return decodeString(uint8, size, pointer);
  }

  if (type >= 0xe0) { // negative fixint
    return type - 256;
  }

  switch (type) {
    case 0xc0: // nil
      return null;
    case 0xc1: // (never used)
      throw new Error(
        "Messagepack decode encountered a type that is never used",
      );
    case 0xc2: // false
      return false;
    case 0xc3: // true
      return true;
    case 0xc4: { // bin 8
      const length = dataView.getUint8(pointer.consumed);
      pointer.consumed++;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      pointer.consumed += length;
      return u8;
    }
    case 0xc5: { // bin 16
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      pointer.consumed += length;
      return u8;
    }
    case 0xc6: { // bin 32
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      pointer.consumed += length;
      return u8;
    }
    case 0xc7: // ext 8
    case 0xc8: // ext 16
    case 0xc9: // ext 32
      throw new Error("ext not implemented yet");
    case 0xca: // float 32
      pointer.consumed += 4;
      return dataView.getFloat32(pointer.consumed - 4);
    case 0xcb: // float 64
      pointer.consumed += 8;
      return dataView.getFloat64(pointer.consumed - 8);
    case 0xcc: // uint 8
      pointer.consumed += 1;
      return dataView.getUint8(pointer.consumed - 1);
    case 0xcd: // uint 16
      pointer.consumed += 2;
      return dataView.getUint16(pointer.consumed - 2);
    case 0xce: // uint 32
      pointer.consumed += 4;
      return dataView.getUint32(pointer.consumed - 4);
    case 0xcf: // uint 64
      pointer.consumed += 8;
      return dataView.getBigUint64(pointer.consumed - 8);
    case 0xd0: // int 8
      pointer.consumed += 1;
      return dataView.getInt8(pointer.consumed - 1);
    case 0xd1: // int 16
      pointer.consumed += 2;
      return dataView.getInt16(pointer.consumed - 2);
    case 0xd2: // int 32
      pointer.consumed += 4;
      return dataView.getInt32(pointer.consumed - 4);
    case 0xd3: // int 64
      pointer.consumed += 8;
      return dataView.getBigInt64(pointer.consumed - 8);
    case 0xd4: // fixext 1
    case 0xd5: // fixext 2
    case 0xd6: // fixext 4
    case 0xd7: // fixext 8
    case 0xd8: // fixext 16
      throw new Error("fixext not implemented yet");
    case 0xd9: { // str 8
      const length = dataView.getUint8(pointer.consumed);
      pointer.consumed += 1;
      return decodeString(uint8, length, pointer);
    }
    case 0xda: { // str 16
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeString(uint8, length, pointer);
    }
    case 0xdb: { // str 32
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeString(uint8, length, pointer);
    }
    case 0xdc: { // array 16
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeArray(uint8, dataView, length, pointer);
    }
    case 0xdd: { // array 32
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeArray(uint8, dataView, length, pointer);
    }
    case 0xde: { // map 16
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeMap(uint8, dataView, length, pointer);
    }
    case 0xdf: { // map 32
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeMap(uint8, dataView, length, pointer);
    }
  }

  // All cases are covered for numbers between 0-255. Typescript isn't smart enough to know that.
  throw new Error("Unreachable");
}
