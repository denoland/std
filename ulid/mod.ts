// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @module
 * @example
 * ```ts
 * import { ulid } from "https://deno.land/std@$STD_VERSION/ulid/mod.ts";
 * ulid(); // 01ARZ3NDEKTSV4RRFFQ69G5FAV
 * ```
 */

import {
  detectPrng,
  encodeRandom,
  encodeTime,
  ENCODING,
  ENCODING_LEN,
  incrementBase32,
  RANDOM_LEN,
  TIME_LEN,
  TIME_MAX,
} from "./_util.ts";

export interface PRNG {
  (): number;
}

export interface ULID {
  (seedTime?: number): string;
}

/**
 * Extracts the timestamp given a ULID
 */
export function decodeTime(id: string): number {
  if (id.length !== TIME_LEN + RANDOM_LEN) {
    throw new Error("malformed ulid");
  }
  const time = id
    .substring(0, TIME_LEN)
    .split("")
    .reverse()
    .reduce((carry, char, index) => {
      const encodingIndex = ENCODING.indexOf(char);
      if (encodingIndex === -1) {
        throw new Error("invalid character found: " + char);
      }
      return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
    }, 0);
  if (time > TIME_MAX) {
    throw new Error("malformed ulid, timestamp too large");
  }
  return time;
}

/**
 * Generates a ULID function given a PRNG
 *
 * @example To use your own pseudo-random number generator, import the factory, and pass it your generator function.
 * ```ts
 * import { factory } from "https://deno.land/std@$STD_VERSION/ulid/mod.ts";
 * const prng = () => Math.random();
 *
 * const ulid = factory(prng);
 * ulid(); // 01BXAVRG61YJ5YSBRM51702F6M
 * ```
 */
export function factory(prng: PRNG = detectPrng()): ULID {
  return function ulid(seedTime: number = Date.now()): string {
    return encodeTime(seedTime, TIME_LEN) + encodeRandom(RANDOM_LEN, prng);
  };
}

/**
 * Generates a monotonically increasing ULID, optionally given a PRNG.
 *
 * @example To generate monotonically increasing ULIDs, create a monotonic counter.
 * ```ts
 * import { monotonicFactory } from "https://deno.land/std@$STD_VERSION/ulid/mod.ts";
 *
 * const ulid = monotonicFactory();
 * // Strict ordering for the same timestamp, by incrementing the least-significant random bit by 1
 * ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVR8
 * ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVR9
 * ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRA
 * ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRB
 * ulid(150000); // 000XAL6S41ACTAV9WEVGEMMVRC
 *
 * // Even if a lower timestamp is passed (or generated), it will preserve sort order
 * ulid(100000); // 000XAL6S41ACTAV9WEVGEMMVRD
 * ```
 *
 * @example You can also pass in a prng to the monotonicFactory function.
 * ```ts
 * import { monotonicFactory } from "https://deno.land/std@$STD_VERSION/ulid/mod.ts";
 * const prng = () => Math.random();
 *
 * const ulid = monotonicFactory(prng);
 * ulid(); // 01BXAVRG61YJ5YSBRM51702F6M
 * ```
 */
export function monotonicFactory(prng: PRNG = detectPrng()): ULID {
  let lastTime = 0;
  let lastRandom: string;
  return function ulid(seedTime: number = Date.now()): string {
    if (seedTime <= lastTime) {
      const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
      return encodeTime(lastTime, TIME_LEN) + incrementedRandom;
    }
    lastTime = seedTime;
    const newRandom = (lastRandom = encodeRandom(RANDOM_LEN, prng));
    return encodeTime(seedTime, TIME_LEN) + newRandom;
  };
}

/**
 * @example
 * ```ts
 * import { ulid } from "https://deno.land/std@$STD_VERSION/ulid/mod.ts";
 * ulid(); // 01ARZ3NDEKTSV4RRFFQ69G5FAV
 *
 * // You can also input a seed time which will consistently give you the same string for the time component
 * ulid(1469918176385); // 01ARYZ6S41TSV4RRFFQ69G5FAV
 * ```
 */
export const ulid = factory();
