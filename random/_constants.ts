// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * The maximum value of a 64-bit unsigned integer plus one.
 * `n % U64_CEIL` simulates uint64 overflow.
 */
export const U64_CEIL = 2n ** 64n;

/**
 * The maximum value of a 32-bit unsigned integer plus one.
 * `n % U32_CEIL` simulates uint32 overflow.
 */
export const U32_CEIL = 2n ** 32n;
