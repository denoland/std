// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * The maximum value of a 64-bit unsigned integer plus one.
 * `n % U64_CEIL` simulates uint64 integer overflow in C.
 */
export const U64_CEIL = 2n ** 64n;

/**
 * The maximum value of a 32-bit unsigned integer plus one.
 * `n % U32_CEIL` simulates uint32 integer overflow in C.
 */
export const U32_CEIL = 2n ** 32n;

// Constants for the PCG32 algorithm.
export const MUL: bigint = 6364136223846793005n;
export const DEFAULT_INC: bigint = 11634580027462260723n;
