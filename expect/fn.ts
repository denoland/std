// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// deno-lint-ignore-file no-explicit-any ban-types

/**
 * This module contains a function to mock functions for testing and assertions.
 *
 * ```ts no-assert
 * import { fn, expect } from "@std/expect";
 *
 * Deno.test("example", () => {
 *   const mockFn = fn((a: number, b: number) => a + b);
 *   const result = mockFn(1, 2);
 *   expect(result).toEqual(3);
 *   expect(mockFn).toHaveBeenCalledWith(1, 2);
 *   expect(mockFn).toHaveBeenCalledTimes(1);
 * });
 * ```
 *
 * @module
 */

import { MOCK_SYMBOL, type MockCall } from "./_mock_util.ts";

/**
 * Creates a mock function that can be used for testing and assertions.
 *
 * @param stubs Functions to be used as stubs for different calls.
 * @returns A mock function that keeps track of calls and returns values based on the provided stubs.
 *
 * @example Usage
 * ```ts no-assert
 * import { fn, expect } from "@std/expect";
 *
 * Deno.test("example", () => {
 *   const mockFn = fn(
 *     (a: number, b: number) => a + b,
 *     (a: number, b: number) => a - b
 *   );
 *   const result = mockFn(1, 2);
 *   expect(result).toEqual(3);
 *   expect(mockFn).toHaveBeenCalledWith(1, 2);
 *   expect(mockFn).toHaveBeenCalledTimes(1);
 *
 *   const result2 = mockFn(3, 2);
 *   expect(result2).toEqual(1);
 *   expect(mockFn).toHaveBeenCalledWith(3, 2);
 *   expect(mockFn).toHaveBeenCalledTimes(2);
 * });
 * ```
 */
export function fn(...stubs: Function[]): Function {
  const calls: MockCall[] = [];

  const f = (...args: any[]) => {
    const stub = stubs.length === 1
      // keep reusing the first
      ? stubs[0]
      // pick the exact mock for the current call
      : stubs[calls.length];

    try {
      const returned = stub ? stub(...args) : undefined;
      calls.push({
        args,
        returned,
        timestamp: Date.now(),
        returns: true,
        throws: false,
      });
      return returned;
    } catch (err) {
      calls.push({
        args,
        timestamp: Date.now(),
        returns: false,
        thrown: err,
        throws: true,
      });
      throw err;
    }
  };

  Object.defineProperty(f, MOCK_SYMBOL, {
    value: { calls },
    writable: false,
  });

  return f;
}
