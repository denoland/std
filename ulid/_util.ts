// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

interface ULID {
  (seedTime?: number): string;
}

interface PRNG {
  (): number;
}

// These values should NEVER change. If
// they do, we're no longer making ulids!
export const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
export const ENCODING_LEN = ENCODING.length;
export const TIME_MAX = Math.pow(2, 48) - 1;
export const TIME_LEN = 10;
export const RANDOM_LEN = 16;

function replaceCharAt(str: string, index: number, char: string) {
  return str.substring(0, index) + char + str.substring(index + 1);
}

function randomChar(prng: PRNG): string {
  let rand = Math.floor(prng() * ENCODING_LEN);
  if (rand === ENCODING_LEN) {
    rand = ENCODING_LEN - 1;
  }
  return ENCODING.charAt(rand);
}

function encodeTime(now: number, len: number = TIME_LEN): string {
  if (now > TIME_MAX) {
    throw new Error("cannot encode time greater than " + TIME_MAX);
  }
  if (now < 0) {
    throw new Error("time must be positive");
  }
  if (Number.isInteger(now) === false) {
    throw new Error("time must be an integer");
  }
  let str = "";
  for (; len > 0; len--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING[mod] + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(len: number, prng: PRNG): string {
  let str = "";
  for (; len > 0; len--) {
    str = randomChar(prng) + str;
  }
  return str;
}

function detectPrng(): PRNG {
  return () => {
    const buffer = new Uint8Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / 0xff;
  };
}

function incrementBase32(str: string): string {
  let index = str.length;
  let char;
  let charIndex;
  const maxCharIndex = ENCODING_LEN - 1;
  while (index-- >= 0) {
    char = str[index];
    charIndex = ENCODING.indexOf(char);
    if (charIndex === -1) {
      throw new Error("incorrectly encoded string");
    }
    if (charIndex === maxCharIndex) {
      str = replaceCharAt(str, index, ENCODING[0]);
      continue;
    }
    return replaceCharAt(str, index, ENCODING[charIndex + 1]);
  }
  throw new Error("cannot increment this string");
}

/**
 * Generates a ULID function given a PRNG
 *
 * @example To use your own pseudo-random number generator, import the factory, and pass it your generator function.
 * ```ts
 * import { factory } from "https://deno.land/std@$STD_VERSION/ulid/_util.ts";
 *
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
 * import { monotonicFactory } from "https://deno.land/std@$STD_VERSION/ulid/_util.ts";
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
 * import { monotonicFactory } from "https://deno.land/std@$STD_VERSION/ulid/_util.ts";
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
