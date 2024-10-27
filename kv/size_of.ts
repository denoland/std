// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * A module to estimate the byte size of a value.
 *
 * @module
 */

const encoder = new TextEncoder();

/**
 * Estimates the size of a string in bytes.
 *
 * @param str The string to calculate the size of
 * @returns The size of the string in bytes
 * @private
 */
function sizeOfString(str: string) {
  return encoder.encode(str).byteLength + 4;
}

/**
 * Estimates the size of an error in bytes.
 *
 * @param seen A set of objects that have already been seen
 * @param error The error to calculate the size of
 * @returns The size of the error in bytes
 * @private
 */
function sizeOfError(seen: WeakSet<object>, error: Error) {
  seen.add(error);
  let bytes = error.name.length + sizeOfString(error.message);
  if (error.stack) {
    bytes += sizeOfString(error.stack);
  }
  if (error.cause) {
    bytes += getCalc(seen)(error.cause);
  }
  return bytes - 4;
}

/**
 * Estimate the size of a map in bytes.
 *
 * @param seen A set of objects that have already been seen
 * @param map The map to calculate the size of
 * @returns The size of the map in bytes
 * @private
 */
function sizeOfMap(seen: WeakSet<object>, map: Map<unknown, unknown>) {
  seen.add(map);
  let bytes = 0;
  for (const [key, value] of map) {
    bytes += getCalc(seen)(key) - 1;
    bytes += getCalc(seen)(value) - 1;
  }
  return bytes - 1;
}

/**
 * Estimate the size of a set in bytes.
 *
 * @param seen A set of objects that have already been seen
 * @param set The set to calculate the size of
 * @returns The size of the set in bytes
 * @private
 */
function sizeOfSet(seen: WeakSet<object>, set: Set<unknown>) {
  seen.add(set);
  let bytes = 0;
  for (const value of set) {
    bytes += getCalc(seen)(value) - 1;
  }
  return bytes;
}

/**
 * Estimate the size of an object in bytes.
 *
 * @param seen A set of objects that have already been seen
 * @param value The object to calculate the size of
 * @returns The size of the object in bytes
 * @private
 */
function sizeOfObject(
  seen: WeakSet<object>,
  value: Record<string, unknown>,
) {
  let bytes = 0;
  for (const key of Object.keys(value)) {
    if (typeof value[key] === "object" && value[key] !== null) {
      if (seen.has(value)) {
        continue;
      }
      seen.add(value[key] as object);
    }
    bytes += getCalc(seen)(key);
    try {
      bytes += getCalc(seen)(value[key]);
    } catch (error) {
      if (error instanceof RangeError) {
        bytes = 0;
      }
    }
  }
  return Math.max(bytes + 1, 5);
}

/**
 * Create a function that calculates the size of a value.
 *
 * @param seen A set of objects that have already been seen
 * @returns A function that calculates the size of a value
 * @private
 */
function getCalc(seen: WeakSet<object>): (value: unknown) => number {
  return function calc(value: unknown) {
    switch (typeof value) {
      case "string":
        return sizeOfString(value);
      case "boolean":
        return 3;
      case "number":
        return value < 64
          ? 4
          : value < 8_192
          ? 5
          : value < 1_048_576
          ? 6
          : value < 134_217_728
          ? 7
          : value < 2_147_483_648
          ? 8
          : 11;
      case "bigint":
        return 12;
      case "undefined":
        return 3;
      case "object":
        if (value === null) {
          return 3;
        }
        if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
          return value.byteLength + 9;
        }
        if (Array.isArray(value)) {
          return value.map(getCalc(seen)).reduce(
            (acc, curr) => acc + curr - 1,
            0,
          );
        }
        if (value instanceof Date) {
          return 11;
        }
        if (value instanceof RegExp) {
          return encoder.encode(value.source).byteLength + 6;
        }
        if (value instanceof Error) {
          return sizeOfError(seen, value);
        }
        if (value instanceof Set) {
          return sizeOfSet(seen, value);
        }
        if (value instanceof Map) {
          return sizeOfMap(seen, value);
        }
        if (value instanceof Deno.KvU64) {
          return 12;
        }
        return sizeOfObject(seen, value as Record<string | symbol, unknown>);
      default:
        return 0;
    }
  };
}

/**
 * Estimates the size, in bytes, of the V8 serialized form of the value, which
 * is used to determine the size of entries being stored in a Deno KV store.
 *
 * This is useful when you want to determine the size of a value before using
 * it as a KV store entry. KV has a key part limit of 2k and a value limit of
 * 64 KB. There are also limits on the total size of atomic operations.
 *
 * kv-toolbox uses this function to estimate the size of items being stored as
 * blobs in the KV store, as well as the size of atomic operations.
 *
 * A more accurate estimate can be obtained by using the V8 `serialize` function
 * but this isn't available in some environments, as well as being 10x slower
 * than this function.
 *
 * > [!NOTE]
 * > The size of the value is an estimate and may not be 100% accurate. Also,
 * > a size of the operation may have some opaque overhead. Users should err on
 * > the side of caution and keep the size of the value below the limits.
 *
 * @param value The value to estimate the size of
 * @returns The estimated size of the value in bytes
 * @example Get the size of a value
 *
 * ```ts
 * import { sizeOf } from "@std/kv/size-of";
 * import { assertEquals } from "@std/assert";
 *
 * const value = { a: new Map([[{ a: 1 }, { b: /234/ }]]), b: false };
 * assertEquals(sizeOf(value), 36);
 * ```
 */
export function sizeOf(value: unknown): number {
  return getCalc(new WeakSet())(value);
}
