// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright 2023 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2017 Alizain Feerasta. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for generating and working with
 * {@link https://github.com/ulid/spec | Universally Unique Lexicographically Sortable Identifiers (ULIDs)}.
 *
 * To generate a ULID use the {@linkcode ulid} function. This will generate a
 * ULID based on the current time.
 *
 * ```ts no-assert
 * import { ulid } from "@std/ulid";
 *
 * ulid(); // 01HYFKMDF3HVJ4J3JZW8KXPVTY
 * ```
 *
 * {@linkcode ulid} does not guarantee that the ULIDs will be strictly
 * increasing for the same current time. If you need to guarantee that the ULIDs
 * will be strictly increasing, even for the same current time, use the
 * {@linkcode monotonicUlid} function.
 *
 * ```ts no-assert
 * import { monotonicUlid } from "@std/ulid";
 *
 * monotonicUlid(); // 01HYFKHG5F8RHM2PM3D7NSTDAS
 * monotonicUlid(); // 01HYFKHG5F8RHM2PM3D7NSTDAT
 * ```
 *
 * Because each ULID encodes the time it was generated, you can extract the
 * timestamp from a ULID using the {@linkcode decodeTime} function.
 *
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
 * @module
 */

export * from "./decode_time.ts";
export * from "./monotonic_ulid.ts";
export * from "./ulid.ts";
