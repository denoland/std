// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Provides helper functions to manipulate `Uint8Array` byte slices that are not
 * included on the `Uint8Array` prototype.
 *
 * ```ts
 * import { concat } from "https://deno.land/std@$STD_VERSION/bytes/concat.ts";
 *
 * const a = new Uint8Array([0, 1, 2]);
 * const b = new Uint8Array([3, 4, 5]);
 * concat([a, b]); // Uint8Array(6) [ 0, 1, 2, 3, 4, 5 ]
 * ```
 *
 * @module
 */

export * from "./concat.ts";
export * from "./copy.ts";
export * from "./ends_with.ts";
export * from "./equals.ts";
export * from "./includes_needle.ts";
export * from "./index_of_needle.ts";
export * from "./last_index_of_needle.ts";
export * from "./repeat.ts";
export * from "./starts_with.ts";
