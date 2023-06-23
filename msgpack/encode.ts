// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { BytesList } from "../bytes/bytes_list.ts";

export type EncodeType =
  | number
  | bigint
  | string
  | boolean
  | null
  | Uint8Array
  | EncodeType[]
  | EncodeMap;

interface EncodeMap {
  [index: string | number]: EncodeType;
}

const FOUR_BITS = 16;
const FIVE_BITS = 32;
const SEVEN_BITS = 128;
const EIGHT_BITS = 256;
const FIFTEEN_BITS = 32768;
const SIXTEEN_BITS = 65536;
const THIRTY_ONE_BITS = 2147483648;
const THIRTY_TWO_BITS = 4294967296;
const SIXTY_THREE_BITS = 9223372036854775808n;
const SIXTY_FOUR_BITS = 18446744073709551616n;

const encoder = new TextEncoder();

export function encode(object: EncodeType) {
  const byteList = new BytesList();
  encodeSlice(object, byteList);
  return byteList.concat();
}

function encodeNumber(num: number) {
  if (!Number.isInteger(num)) {
    const dataView = new DataView(new ArrayBuffer(9));
    dataView.setFloat64(1, num);
    dataView.setUint8(0, 0xcb);
    return new Uint8Array(dataView.buffer);
  }

  if (num < 0) {
    if (num <= -1 && num >= -FIVE_BITS) { // negative fixint
      return new Uint8Array([num]);
    }

    if (num >= -SEVEN_BITS) { // int 8
      return new Uint8Array([0xd0, num]);
    }

    if (num >= -FIFTEEN_BITS) { // int 16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setInt16(1, num);
      dataView.setUint8(0, 0xd1);
      return new Uint8Array(dataView.buffer);
    }

    if (num >= -THIRTY_ONE_BITS) { // int 32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setInt32(1, num);
      dataView.setUint8(0, 0xd2);
      return new Uint8Array(dataView.buffer);
    }

    if (num >= -SIXTY_THREE_BITS) { // int 64
      const dataView = new DataView(new ArrayBuffer(9));
      dataView.setBigInt64(1, BigInt(num));
      dataView.setUint8(0, 0xd3);
      return new Uint8Array(dataView.buffer);
    }
  }

  // if the number fits within a positive fixint, use it
  if (num >= 0 && num <= 0x7f) {
    return new Uint8Array([num]);
  }

  if (num < EIGHT_BITS) { // uint8
    return new Uint8Array([0xcc, num]);
  }

  if (num < SIXTEEN_BITS) { // uint16
    const dataView = new DataView(new ArrayBuffer(3));
    dataView.setUint16(1, num);
    dataView.setUint8(0, 0xcd);
    return new Uint8Array(dataView.buffer);
  }

  if (num < THIRTY_TWO_BITS) { // uint32
    const dataView = new DataView(new ArrayBuffer(5));
    dataView.setUint32(1, num);
    dataView.setUint8(0, 0xce);
    return new Uint8Array(dataView.buffer);
  }

  if (num < SIXTY_FOUR_BITS) { // uint64
    const dataView = new DataView(new ArrayBuffer(9));
    dataView.setBigUint64(1, BigInt(num));
    dataView.setUint8(0, 0xcf);
    return new Uint8Array(dataView.buffer);
  }

  throw new Error("Unreachable");
}

function encodeSlice(object: EncodeType, byteList: BytesList) {
  if (object === null) {
    byteList.add(new Uint8Array([0xc0]));
    return;
  }

  if (object === false) {
    byteList.add(new Uint8Array([0xc2]));
    return;
  }

  if (object === true) {
    byteList.add(new Uint8Array([0xc3]));
    return;
  }

  if (typeof object === "number") {
    byteList.add(encodeNumber(object));
    return;
  }

  if (typeof object === "bigint") {
    if (object < 0) {
      if (object < -SIXTY_THREE_BITS) {
        throw new Error("Cannot safely encode bigint larger than 64 bits");
      }

      const dataView = new DataView(new ArrayBuffer(9));
      dataView.setBigInt64(1, object);
      dataView.setUint8(0, 0xd3);
      byteList.add(new Uint8Array(dataView.buffer));
      return;
    }

    if (object >= SIXTY_FOUR_BITS) {
      throw new Error("Cannot safely encode bigint larger than 64 bits");
    }

    const dataView = new DataView(new ArrayBuffer(9));
    dataView.setBigUint64(1, object);
    dataView.setUint8(0, 0xd3);
    byteList.add(new Uint8Array(dataView.buffer));
    return;
  }

  if (typeof object === "string") {
    const encoded = encoder.encode(object);
    const len = encoded.length;

    if (len < FIVE_BITS) { // fixstr
      byteList.add(new Uint8Array([0xa0 | len]));
    } else if (len < EIGHT_BITS) { // str 8
      byteList.add(new Uint8Array([0xd9, len]));
    } else if (len < SIXTEEN_BITS) { // str 16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, len);
      dataView.setUint8(0, 0xda);
      byteList.add(new Uint8Array(dataView.buffer));
    } else if (len < THIRTY_TWO_BITS) { // str 32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, len);
      dataView.setUint8(0, 0xdb);
      byteList.add(new Uint8Array(dataView.buffer));
    } else {
      throw new Error(
        "Cannot safely encode string with size larger than 32 bits",
      );
    }
    byteList.add(encoded);
    return;
  }

  if (object instanceof Uint8Array) {
    if (object.length < EIGHT_BITS) { // bin 8
      byteList.add(new Uint8Array([0xc4, object.length]));
    } else if (object.length < SIXTEEN_BITS) { // bin 16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, object.length);
      dataView.setUint8(0, 0xc5);
      byteList.add(new Uint8Array(dataView.buffer));
    } else if (object.length < THIRTY_TWO_BITS) { // bin 32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, object.length);
      dataView.setUint8(0, 0xc6);
      byteList.add(new Uint8Array(dataView.buffer));
    } else {
      throw new Error(
        "Cannot safely encode Uint8Array with size larger than 32 bits",
      );
    }
    byteList.add(object);
    return;
  }

  if (Array.isArray(object)) {
    if (object.length < FOUR_BITS) { // fixarray
      byteList.add(new Uint8Array([0x90 | object.length]));
    } else if (object.length < SIXTEEN_BITS) { // array 16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, object.length);
      dataView.setUint8(0, 0xdc);
      byteList.add(new Uint8Array(dataView.buffer));
    } else if (object.length < THIRTY_TWO_BITS) { // array 32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, object.length);
      dataView.setUint8(0, 0xdd);
      byteList.add(new Uint8Array(dataView.buffer));
    } else {
      throw new Error(
        "Cannot safely encode array with size larger than 32 bits",
      );
    }

    for (const obj of object) {
      encodeSlice(obj, byteList);
    }
    return;
  }

  // If object is a plain object
  if (object.constructor === Object) {
    const numKeys = Object.keys(object).length;

    if (numKeys < FOUR_BITS) { // fixarray
      byteList.add(new Uint8Array([0x80 | numKeys]));
    } else if (numKeys < SIXTEEN_BITS) { // map 16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, numKeys);
      dataView.setUint8(0, 0xde);
      byteList.add(new Uint8Array(dataView.buffer));
    } else if (numKeys < THIRTY_TWO_BITS) { // map 32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, numKeys);
      dataView.setUint8(0, 0xdf);
      byteList.add(new Uint8Array(dataView.buffer));
    } else {
      throw new Error("Cannot safely encode map with size larger than 32 bits");
    }

    for (const [key, value] of Object.entries(object)) {
      encodeSlice(key, byteList);
      encodeSlice(value, byteList);
    }
  }

  throw new Error("Cannot safely encode value into messagepack");
}
