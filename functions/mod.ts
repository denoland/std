// Copyright 2018-2025 the Deno authors. MIT license.

// This module is browser compatible.

/**
 * Utilities for working with functions.
 *
 * ```ts
 *  import { pipe } from "@std/functions";
 *  import { assertEquals } from "@std/assert";
 *
 *  const myPipe = pipe(
 *    Math.abs,
 *    Math.sqrt,
 *    Math.floor,
 *    (num: number) => `result: ${num}`,
 *  );
 *  assertEquals(myPipe(-2), "result: 1");
 * ```
 *
 * @module
 */
export * from "./pipe.ts";
