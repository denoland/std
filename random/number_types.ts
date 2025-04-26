// Copyright 2018-2025 the Deno authors. MIT license.
import type { ByteGenerator } from "./_types.ts";

const b8 = new Uint8Array(8);
const dv8 = new DataView(b8.buffer);

// 0x1.0p-53
const FLOAT_64_MULTIPLIER = 2 ** -53;
// assert(1 / FLOAT_64_MULTIPLIER === Number.MAX_SAFE_INTEGER + 1)

/**
 * Get a float64 in the range `[0, 1)` from a random byte generator.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param byteGenerator A function that fills a `Uint8Array` with random bytes.
 * @returns A float64 in the range `[0, 1)`.
 *
 * @example With a seeded byte generator
 * ```ts
 * import { nextFloat64, byteGeneratorSeeded } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const byteGenerator = byteGeneratorSeeded(1n);
 * assertEquals(nextFloat64(byteGenerator), 0.49116444173310125);
 * assertEquals(nextFloat64(byteGenerator), 0.06903754193160427);
 * assertEquals(nextFloat64(byteGenerator), 0.16063206851777034);
 * ```
 *
 * @example With an arbitrary byte generator
 * ```ts
 * import { nextFloat64 } from "@std/random";
 * import { assertLess, assertGreaterOrEqual } from "@std/assert";
 *
 * const val = nextFloat64(crypto.getRandomValues.bind(crypto)); // example: 0.8928746327842533
 * assertGreaterOrEqual(val, 0);
 * assertLess(val, 1);
 * ```
 */
export function nextFloat64(byteGenerator: ByteGenerator): number {
  byteGenerator(b8);
  const int53 = Number(dv8.getBigUint64(0, true) >> 11n);
  // assert(int53 <= Number.MAX_SAFE_INTEGER)
  return int53 * FLOAT_64_MULTIPLIER;
}
