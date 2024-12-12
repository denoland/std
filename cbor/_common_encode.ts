// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { concat } from "@std/bytes";
import { numberToArray } from "./_common.ts";
import { encodeCbor } from "./encode_cbor.ts";
import type { CborTag } from "./tag.ts";
import type { CborType } from "./types.ts";

export function encodeNumber(x: number): Uint8Array {
  if (x % 1 === 0) {
    const isNegative = x < 0;
    const majorType = isNegative ? 0b001_00000 : 0b000_00000;
    if (isNegative) x = -x - 1;

    if (x < 24) return Uint8Array.from([majorType + x]);
    if (x < 2 ** 8) return Uint8Array.from([majorType + 24, x]);
    const output = new Uint8Array(9);
    const view = new DataView(output.buffer);
    if (x < 2 ** 16) {
      output[0] = majorType + 25;
      view.setUint16(1, x);
      return output.subarray(0, 3);
    }
    if (x < 2 ** 32) {
      output[0] = majorType + 26;
      view.setUint32(1, x);
      return output.subarray(0, 5);
    }
    if (x < 2 ** 64) {
      output[0] = majorType + 27;
      // Due to possible precision loss with numbers this large, it's best to do conversion under BigInt or end up with 1n off.
      view.setBigUint64(1, BigInt(x));
      return output;
    }
    throw new RangeError(
      `Cannot encode number: It (${isNegative ? -x - 1 : x}) exceeds ${
        isNegative ? "-" : ""
      }2 ** 64 - 1`,
    );
  }
  const output = new Uint8Array(9);
  const view = new DataView(output.buffer);
  output[0] = 0b111_11011;
  view.setFloat64(1, x);
  return output;
}

export function encodeBigInt(x: bigint): Uint8Array {
  const isNegative = x < 0n;
  if ((isNegative ? -x : x) < 2n ** 32n) return encodeNumber(Number(x));

  const output = new Uint8Array(9);
  const view = new DataView(output.buffer);
  if (isNegative) x = -x - 1n;
  if (x < 2n ** 64n) {
    output[0] = isNegative ? 0b001_11011 : 0b000_11011;
    view.setBigUint64(1, x);
    return output;
  }
  throw new RangeError(
    `Cannot encode bigint: It (${isNegative ? -x - 1n : x}) exceeds ${
      isNegative ? "-" : ""
    }2 ** 64 - 1`,
  );
}

export function encodeUint8Array(x: Uint8Array): Uint8Array {
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

export function encodeString(x: string): Uint8Array {
  const array = encodeUint8Array(new TextEncoder().encode(x));
  array[0]! += 1 << 5;
  return array;
}

export function encodeDate(x: Date): Uint8Array {
  const input = encodeNumber(x.getTime() / 1000);
  // deno-lint-ignore no-explicit-any
  const output = new Uint8Array((input.buffer as any)
    .transfer(input.length + 1));
  output.set(output.subarray(0, -1), 1);
  output[0] = 0b110_00001;
  return output;
}

export function encodeMap(x: Map<CborType, CborType>): Uint8Array {
  const len = x.size;
  let head: Uint8Array;
  if (len < 24) head = Uint8Array.from([0b101_00000 + len]);
  else if (len < 2 ** 8) head = Uint8Array.from([0b101_11000, len]);
  else {
    head = new Uint8Array(9);
    const view = new DataView(head.buffer);
    if (len < 2 ** 16) {
      head[0] = 0b101_11001;
      view.setUint16(1, len);
      head = head.subarray(0, 3);
    } else if (len < 2 ** 32) {
      head[0] = 0b101_11010;
      view.setUint32(1, len);
      head = head.subarray(0, 5);
    } else {
      head[0] = 0b101_11011;
      view.setBigUint64(1, BigInt(len));
    }
  }
  return concat([
    Uint8Array.from([217, 1, 3]), // TagNumber 259
    head,
    ...Array.from(x
      .entries())
      .map(([k, v]) => [encodeCbor(k), encodeCbor(v)])
      .flat(),
  ]);
}

export function encodeArray(x: CborType[]): Uint8Array {
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

export function encodeObject(x: { [k: string]: CborType }): Uint8Array {
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

export function encodeTag(x: CborTag<CborType>) {
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
