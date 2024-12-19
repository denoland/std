// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for working with functions.
 *
 * ```ts
 *  const myPipe = pipe(
 *    Math.abs,
 *    Math.sqrt,
 *    Math.floor,
 *    (num) => `result: ${num}`,
 *  );
 *  assertEquals(myPipe(-2), "result: 1");
 * ```
 *
 * @module
 */

export * from "./pipe.ts";
