// Copyright 2018-2025 the Deno authors. MIT license.
import type { ByteGenerator } from "./_types.ts";

const b8 = new Uint8Array(8);
const dv8 = new DataView(b8.buffer);

// 0x1.0p-53
const FLOAT_64_MULTIPLIER = 2 ** -53;
// assert(1 / FLOAT_64_MULTIPLIER === Number.MAX_SAFE_INTEGER + 1)

/**
 * Generates a pseudo-random float64 in the range `[0, 1)`.
 *
 * @example
 * ```ts
 * import { nextFloat64, seededByteGenerator } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const byteGenerator = seededByteGenerator(1n);
 * assertEquals(nextFloat64(byteGenerator), 0.49116444173310125);
 * assertEquals(nextFloat64(byteGenerator), 0.06903754193160427);
 * assertEquals(nextFloat64(byteGenerator), 0.16063206851777034);
 * ```
 */
export function nextFloat64(byteGenerator: ByteGenerator): number {
  byteGenerator(b8);
  const int53 = Number(dv8.getBigUint64(0, true) >> 11n);
  // assert(int53 <= Number.MAX_SAFE_INTEGER)
  return int53 * FLOAT_64_MULTIPLIER;
}

/** The signedness of an integer type. */
export type Signedness = "Int" | "Uint";
/** The name of a small integer type. */
export type SmallIntName = `${Signedness}${8 | 16 | 32}`;
/** The name of a big integer type. */
export type BigIntName = `Big${Signedness}${64}`;
/** The name of an integer type. */
export type IntName = SmallIntName | BigIntName;
/** The JavaScript numeric type corresponding to an integer type name. */
export type NumberTypeOf<T extends IntName> = T extends BigIntName ? bigint
  : number;

/**
 * Generates a pseudo-random integer of the requested type.
 *
 * @example
 * ```ts
 * import { nextInteger, seededByteGenerator } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const byteGenerator = seededByteGenerator(1n);
 * assertEquals(nextInteger(byteGenerator, "Uint32"), 866585574);
 * assertEquals(nextInteger(byteGenerator, "Int16"), -3090);
 * assertEquals(nextInteger(byteGenerator, "Int16"), 18257);
 * assertEquals(nextInteger(byteGenerator, "BigUint64"), 17942321377934340544n);
 */
export function nextInteger<T extends IntName>(
  byteGenerator: ByteGenerator,
  integerType: T,
): NumberTypeOf<T> {
  const numBytesNeeded = Number(integerType.match(/\d+$/)![0]) / 8;
  byteGenerator(b8.subarray(0, numBytesNeeded));
  const int = dv8[`get${integerType}`](0, true);
  return int as NumberTypeOf<T>;
}
