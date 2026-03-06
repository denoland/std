// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.
// This module is browser compatible.

import {
  ENCODING,
  ENCODING_LEN,
  TIME_LEN,
  TIME_MAX,
  ULID_LEN,
} from "./_util.ts";

/**
 * Extracts the number of milliseconds since the Unix epoch that had passed when
 * the ULID was generated. If the ULID is malformed, an error will be thrown.
 *
 * @example Decode the time from a ULID
 * ```ts
 * import { decodeTime, ulid } from "@std/ulid";
 * import { assertEquals } from "@std/assert";
 *
 * const timestamp = 150_000;
 * const ulidString = ulid(timestamp);
 *
 * assertEquals(decodeTime(ulidString), timestamp);
 * ```
 *
 * @param ulid The ULID to extract the timestamp from.
 * @returns The number of milliseconds since the Unix epoch that had passed when the ULID was generated.
 */
export function decodeTime(ulid: string): number {
  if (ulid.length !== ULID_LEN) {
    throw new Error(`ULID must be exactly ${ULID_LEN} characters long`);
  }
  const time = ulid
    .substring(0, TIME_LEN)
    .split("")
    .reverse()
    .reduce((carry, char, index) => {
      const encodingIndex = ENCODING.indexOf(char);
      if (encodingIndex === -1) {
        throw new Error(`Invalid ULID character found: ${char}`);
      }
      return (carry += encodingIndex * Math.pow(ENCODING_LEN, index));
    }, 0);
  if (time > TIME_MAX) {
    throw new RangeError(
      `ULID timestamp component exceeds maximum value of ${TIME_MAX}`,
    );
  }
  return time;
}
