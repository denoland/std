// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.
// This module is browser compatible.

import { encodeRandom, encodeTime } from "./_util.ts";

/**
 * Generate a ULID, optionally based on a given timestamp. If the timestamp is
 * not passed, it will default to `Date.now()`.
 *
 * Multiple calls to this function with the same seed time will not guarantee
 * that the ULIDs will be strictly increasing, even if the seed time is the
 * same. For that, use the {@linkcode monotonicUlid} function.
 *
 * @example Generate a ULID
 * ```ts no-assert
 * import { ulid } from "@std/ulid";
 *
 * ulid(); // 01HYFKMDF3HVJ4J3JZW8KXPVTY
 * ulid(); // 01HYFKMDF3D2P7G502B9Z2VKV0
 * ulid(); // 01HYFKMDZQ7JD17CRKDXQSZ3Z4
 * ```
 *
 * @example Generate a ULID with a seed time
 * ```ts no-assert
 * import { ulid } from "@std/ulid";
 *
 * ulid(150000); // 0000004JFG3EKDRE04TVVDJW7K
 * ulid(150000); // 0000004JFGN0KHBH0447AK895X
 * ulid(150000); // 0000004JFGMRDH0PN7SM8BZN06
 * ```
 *
 * @param seedTime The time to base the ULID on, in milliseconds since the Unix epoch. Defaults to `Date.now()`.
 * @returns A ULID.
 */
export function ulid(seedTime: number = Date.now()): string {
  return encodeTime(seedTime) + encodeRandom();
}
