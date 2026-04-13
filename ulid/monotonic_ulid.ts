// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.
// This module is browser compatible.

import { monotonicFactory } from "./_util.ts";

const defaultMonotonicUlid = monotonicFactory();

/**
 * Generate a ULID that monotonically increases even for the same millisecond,
 * optionally passing the current time. If the current time is not passed, it
 * will default to `Date.now()`.
 *
 * Unlike the {@linkcode ulid} function, this function is guaranteed to return
 * strictly increasing ULIDs, even for the same seed time, but only if the seed
 * time only ever increases. If the seed time ever goes backwards, the ULID will
 * still be generated, but it will not be guaranteed to be monotonic with
 * previous ULIDs for that same seed time.
 *
 * @example Generate a monotonic ULID
 * ```ts no-assert
 * import { monotonicUlid } from "@std/ulid";
 *
 * monotonicUlid(); // 01HYFKHG5F8RHM2PM3D7NSTDAS
 * monotonicUlid(); // 01HYFKHG5F8RHM2PM3D7NSTDAT
 * monotonicUlid(); // 01HYFKHHX8H4BRY8BYHAV1BZ2T
 * ```
 *
 * @example Generate a monotonic ULID with a seed time
 * ```ts no-assert
 * import { monotonicUlid } from "@std/ulid";
 *
 * // Strict ordering for the same timestamp, by incrementing the least-significant random bit by 1
 * monotonicUlid(150000); // 0000004JFHJJ2Z7X64FN2B4F1Q
 * monotonicUlid(150000); // 0000004JFHJJ2Z7X64FN2B4F1R
 * monotonicUlid(150000); // 0000004JFHJJ2Z7X64FN2B4F1S
 * monotonicUlid(150000); // 0000004JFHJJ2Z7X64FN2B4F1T
 * monotonicUlid(150000); // 0000004JFHJJ2Z7X64FN2B4F1U
 *
 * // A different timestamp will reset the random bits
 * monotonicUlid(150001); // 0000004JFHJJ2Z7X64FN2B4F1P
 *
 * // A previous seed time will not guarantee ordering, and may result in a
 * // ULID lower than one with the same seed time generated previously
 * monotonicUlid(150000); // 0000004JFJ7XF6D76ES95SZR0X
 * ```
 *
 * @param seedTime The time to base the ULID on, in milliseconds since the Unix epoch. Defaults to `Date.now()`.
 * @returns A ULID that is guaranteed to be strictly increasing for the same seed time.
 */
export function monotonicUlid(seedTime: number = Date.now()): string {
  return defaultMonotonicUlid(seedTime);
}
