// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Converts a hex byte array to a UUID string.
 *
 * @param bytes Byte array of the UUID.
 *
 * @returns UUID string.
 */
export function bytesToUuid(bytes: number[] | Uint8Array): string {
  const bits = [...bytes].map((bit) => {
    const s = bit.toString(16);
    return bit < 0x10 ? "0" + s : s;
  });
  return [
    ...bits.slice(0, 4),
    "-",
    ...bits.slice(4, 6),
    "-",
    ...bits.slice(6, 8),
    "-",
    ...bits.slice(8, 10),
    "-",
    ...bits.slice(10, 16),
  ].join("");
}

/**
 * Converts a UUID string to a hex byte array.
 *
 * @param uuid Value that gets converted.
 *
 * @returns Byte array of the UUID.
 */
export function uuidToBytes(uuid: string): number[] {
  return uuid
    .replace("-", "")
    .match(/[a-fA-F0-9]{2}/g)!
    .map((byte) => parseInt(byte, 16));
}
