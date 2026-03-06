// Copyright 2018-2026 the Deno authors. MIT license.

/** Type for a ULID generator function. */
// deno-lint-ignore deno-style-guide/naming-convention
export type ULID = (seedTime?: number) => string;

// These values should NEVER change. If
// they do, we're no longer making ulids!
export const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
export const ENCODING_LEN = ENCODING.length;
export const TIME_MAX = Math.pow(2, 48) - 1;
export const TIME_LEN = 10;
export const RANDOM_LEN = 16;
export const ULID_LEN = TIME_LEN + RANDOM_LEN;

function replaceCharAt(str: string, index: number, char: string) {
  return str.substring(0, index) + char + str.substring(index + 1);
}

export function encodeTime(timestamp: number): string {
  if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > TIME_MAX) {
    throw new RangeError(
      `Time must be a positive integer less than ${TIME_MAX}`,
    );
  }
  let str = "";
  for (let len = TIME_LEN; len > 0; len--) {
    const mod = timestamp % ENCODING_LEN;
    str = ENCODING[mod] + str;
    timestamp = Math.floor(timestamp / ENCODING_LEN);
  }
  return str;
}

export function encodeRandom(): string {
  let str = "";
  const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_LEN));
  for (const byte of bytes) {
    str += ENCODING[byte % ENCODING_LEN];
  }
  return str;
}

export function incrementBase32(str: string): string {
  let index = str.length;
  let char;
  let charIndex;
  const maxCharIndex = ENCODING_LEN - 1;
  while (--index >= 0) {
    char = str[index]!;
    charIndex = ENCODING.indexOf(char);
    if (charIndex === -1) {
      throw new TypeError("Incorrectly encoded string");
    }
    if (charIndex === maxCharIndex) {
      str = replaceCharAt(str, index, ENCODING[0]!);
      continue;
    }
    return replaceCharAt(str, index, ENCODING[charIndex + 1]!);
  }
  throw new Error("Cannot increment this string");
}

/** Generates a monotonically increasing ULID. */
export function monotonicFactory(encodeRand = encodeRandom): ULID {
  let lastTime = 0;
  let lastRandom: string;
  return function ulid(seedTime: number = Date.now()): string {
    if (seedTime <= lastTime) {
      const incrementedRandom = (lastRandom = incrementBase32(lastRandom));
      return encodeTime(lastTime) + incrementedRandom;
    }
    lastTime = seedTime;
    const newRandom = (lastRandom = encodeRand());
    return encodeTime(seedTime) + newRandom;
  };
}
