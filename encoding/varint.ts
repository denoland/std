// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This implementation is a port of https://deno.land/x/varint@v2.0.0 by @keithamus
// This module is browser compatible.

export const MaxUInt64 = 18446744073709551615n;
export const MaxVarIntLen64 = 10;
export const MaxVarIntLen32 = 5;

const U32MAX = 4_294_967_295;
const U64MAX = 18_446_744_073_709_551_615n;

const MSB = 0x80;
const REST = 0x7f;
const SHIFT = 7;
const MSBN = 0x80n;
const SHIFTN = 7n;

/**
 * Takes unsigned number `num` and converts it into a VarInt encoded
 * `Uint8Array`, returning  a `Uint8Array` slice of the
 * encoded VarInt.
 *
 * If `buf` is not given then a Uint8Array will be created.
 * `offset` defaults to `0`.
 *
 * If passed `buf` then that will be written into, starting at `offset`. The
 * resulting returned `Uint8Array` will be a slice of `buf`.
 *
 * ```ts
 * import { encodeU32 } from "https://deno.land/std@$STD_VERSION/encoding/varint.ts";
 *
 * encodeU32(1) == Uint8Array.of(0x7F, 0x02);
 * encodeU32(300) == Uint8Array.of(0x7F, 0x02);
 * ```
 */
export function encodeU32(
  num: number,
  buf: Uint8Array = new Uint8Array(MaxVarIntLen64),
  offset = 0,
): Uint8Array {
  if (!Number.isInteger(num)) throw new TypeError("Floats are not supported");
  if (num < 0) throw new RangeError("Signed integers are not supported");
  if (num > U32MAX) {
    throw new RangeError(
      `The given number exceeds the limit of unsigned integer: ${num}`,
    );
  }
  for (
    let i = offset, len = Math.min(buf.length, MaxVarIntLen64);
    i <= len;
    i += 1
  ) {
    if (num < MSBN) {
      buf[i] = Number(num);
      i += 1;
      return buf.slice(offset, i);
    }
    buf[i] = Number((num & 0xFF) | MSB);
    num >>= SHIFT;
  }
  return buf;
}

/**
 * Takes unsigned number `num` and converts it into a VarInt encoded
 * `Uint8Array`, returning a `Uint8Array` slice of the
 * encoded VarInt.
 *
 * If `buf` is not given then a Uint8Array will be created.
 * `offset` defaults to `0`.
 *
 * If passed `buf` then that will be written into, starting at `offset`. The
 * resulting returned `Uint8Array` will be a slice of `buf`
 *
 * ```ts
 * import { encodeU64 } from "https://deno.land/std@$STD_VERSION/encoding/varint.ts";
 *
 * encodeU64(4294967295n) === Uint8Array.of(0xFF, 0xFF, 0xFF, 0xFF, 0x0F);
 * ```
 */
export function encodeU64(
  num: bigint,
  buf: Uint8Array = new Uint8Array(MaxVarIntLen64),
  offset = 0,
): Uint8Array {
  if (num < 0) throw new RangeError("Signed integers are not supported");
  if (num > U64MAX) {
    throw new RangeError(
      `The given number exceeds the limit of unsigned long integer: ${num}`,
    );
  }
  for (
    let i = offset, len = Math.min(buf.length, MaxVarIntLen64);
    i <= len;
    i += 1
  ) {
    if (num < MSBN) {
      buf[i] = Number(num);
      i += 1;
      return buf.slice(offset, i);
    }
    buf[i] = Number((num & 0xFFn) | MSBN);
    num >>= SHIFTN;
  }
  return buf;
}

/**
 * Given a `buf`, starting at `offset` (default: 0), begin decoding bytes as
 * VarInt encoded bytes, for a maximum of 5 bytes (offset + 5). The return
 * is of the decoded varint 32-bit number.
 *
 * VarInts are _not 32-bit by default_ so this should only be used in cases
 * where the varint is _assured_ to be 32-bits.
 *
 * To know how many bytes the VarInt took to encode, simply negate `offset`
 * from the returned new `offset`.
 */
export function decodeU32(buf: Uint8Array, offset = 0): number {
  if (buf.length > 5) throw new RangeError("Too many bytes");
  let decoded = 0;
  for (
    let i = offset,
      len = Math.min(buf.length, offset + MaxVarIntLen32),
      shift = 0;
    i <= len;
    i += 1, shift += SHIFT
  ) {
    const byte = buf[i];
    decoded += (byte & REST) * Math.pow(2, shift);
    if (!(byte & MSB)) return decoded;
  }
  throw new RangeError(`Bad varint: ${buf}`);
}

/**
 * Given a `buf`, starting at `offset` (default: 0), begin decoding bytes as
 * VarInt encoded bytes, for a maximum of 10 bytes (offset + 10). The return
 * is of the decoded varint 32-bit number.
 *
 * If a `bigint` in return is undesired, the `decode32` function will return a
 * `number`, but this should only be used in cases where the varint is
 * _assured_ to be 32-bits.
 *
 * To know how many bytes the VarInt took to encode, simply negate `offset`
 * from the returned new `offset`.
 */
export function decodeU64(buf: Uint8Array, offset = 0): bigint {
  if (buf.length > 10) throw new RangeError("Too many bytes");
  for (
    let i = offset,
      len = Math.min(buf.length, offset + MaxVarIntLen64),
      shift = 0,
      decoded = 0n;
    i < len;
    i += 1, shift += SHIFT
  ) {
    const byte = buf[i];
    decoded += BigInt((byte & REST) * Math.pow(2, shift));
    if (!(byte & MSB) && decoded > MaxUInt64) {
      throw new RangeError(`Bad varint: ${buf}`);
    }
    if (!(byte & MSB)) return decoded;
  }
  throw new RangeError(`Bad varint: ${buf}`);
}
