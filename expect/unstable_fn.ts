// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// Copyright 2024 Anton Mikhailov. All rights reserved. MIT License.

import { createMockInstance, type Functor } from "./_unstable_mock_instance.ts";
import type { ExpectMockInstance } from "./_unstable_mock_utils.ts";

/**
 * This module contains jest compatible `fn()` utility to mock functions for testing and assertions.
 *
 * ```ts
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
export function fn<Args extends unknown[], Return>(): Functor<Args, Return> &
  ExpectMockInstance<Args, Return>;
export function fn<
  Fn extends Functor<never, unknown> = Functor<unknown[], unknown>
>(
  original: Fn,
  ...initialStubs: Functor<Parameters<Fn>, ReturnType<Fn>>[]
): Fn & ExpectMockInstance<Parameters<Fn>, ReturnType<Fn>>;
export function fn<Args extends unknown[], Return>(
  original: Functor<Args, Return>,
  ...initialStubs: Functor<Args, Return>[]
): Functor<Args, Return> & ExpectMockInstance<Args, Return>;
export function fn<Args extends unknown[], Return>(
  original?: Functor<Args, Return>,
  ...initialStubs: Functor<Args, Return>[]
): Functor<Args, Return> & ExpectMockInstance<Args, Return> {
  return createMockInstance(
    original,
    initialStubs.toReversed(),
    (calls, stubState) =>
      (...args: Args) => {
        const stub = stubState.once.pop() ?? stubState.current;
        try {
          const returned = stub?.(...args);
          calls.push({
            args,
            timestamp: Date.now(),
            result: "returned",
            returned,
          });
          return returned;
        } catch (error) {
          calls.push({ args, timestamp: Date.now(), result: "thrown", error });
          throw error;
        }
      }
  );
}
