// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.

import { createMockInstance, type Functor } from "./_unstable_mock_instance.ts";
import type { ExpectMockInstance } from "./_unstable_mock_utils.ts";

/**
 * This module contains jest compatible `fn()` utility to mock functions for testing and assertions.
 *
 * ```ts
 * import { expect } from "@std/expect/unstable-expect";
 * import { fn } from "@std/expect/unstable-fn";
 *
 * Deno.test("example", () => {
 *   const mockFn = fn((a: number, b: number) => a + b);
 *   mockFn.mockReturnValueOnce(4);
 *   expect(mockFn(1, 2)).toEqual(4);
 *   expect(mockFn(1, 2)).toEqual(3);
 *   expect(mockFn).toHaveBeenCalledWith(1, 2);
 *   expect(mockFn).toHaveBeenCalledTimes(2);
 * });
 *
 * Deno.test("example combine args stubs and dynamic addition", () => {
 *   const mockFn = fn(
 *     (a: number, b: number) => a + b,
 *     (a, b) => a - b,
 *   );
 *   mockFn.mockImplementationOnce((a, b) => a * b).mockImplementationOnce((a, b) => a / b);
 *   expect(mockFn(1, 2)).toEqual(4);
 *   expect(mockFn(1, 2)).toEqual(-1);
 *   expect(mockFn(1, 2)).toEqual(2);
 *   expect(mockFn(1, 2)).toEqual(0.5);
 * });
 * ```
 *
 * @module
 */

/**
 * Creates a mock function that can be used for testing and assertions.
 * Could accept arguments and return type generic arguments.
 *
 * @example Usage
 * ```ts
 * import { expect } from "@std/expect/unstable-expect";
 * import { fn } from "@std/expect/unstable-fn";
 *
 * Deno.test("example", () => {
 *   const mockFn = fn()
 *   expect(mockFn()).toBeUndefined();
 *   expect(mockFn).toHaveBeenCalledWith();
 *   expect(mockFn).toHaveBeenCalledTimes(1);
 * });
 * ```
 */
export function fn<Args extends unknown[] = unknown[], Return = unknown>():
  & Functor<
    Args,
    Return
  >
  & ExpectMockInstance<Args, Return>;

/**
 * Creates a mock function that can be used for testing and assertions.
 * Accepts an original implementation and a list of stubs.
 * After all stubs are used, the original implementation is restored.
 * Infers the arguments and return type from the original function.
 *
 * @example Usage
 * ```ts
 * import { expect } from "@std/expect/unstable-expect";
 * import { fn } from "@std/expect/unstable-fn";
 *
 * Deno.test("example", () => {
 *   const op = fn(
 *     (a: number, b: number) => a + b,
 *     (a, b) => a - b,
 *     (a, b) => a * b,
 *   );
 *   expect(op(1, 2)).toEqual(3);
 *   expect(op(1, 2)).toEqual(-1);
 *   expect(op(1, 2)).toEqual(2);
 *   expect(op(1, 2)).toEqual(3);
 * });
 * ```
 */
export function fn<
  // deno-lint-ignore no-explicit-any
  Fn extends Functor<any[], unknown> = Functor<unknown[], unknown>,
>(
  original: Fn,
  ...stubs: Functor<Parameters<NoInfer<Fn>>, ReturnType<NoInfer<Fn>>>[]
): Fn & ExpectMockInstance<Parameters<Fn>, ReturnType<Fn>>;

/**
 * Creates a mock function that can be used for testing and assertions.
 * Accepts an original implementation and a list of stubs.
 * After all stubs are used, the original implementation is restored.
 * Version that uses manually provided arguments and return value types.
 *
 * @example Usage
 * ```ts
 * import { expect } from "@std/expect/unstable-expect";
 * import { fn } from "@std/expect/unstable-fn";
 *
 * Deno.test("example", () => {
 *   const op = fn<[a: number, b: number], string>(
 *     (a, b) => String(a + b),
 *   );
 *   expect(op(1, 2)).toEqual('3');
 * });
 * ```
 */
export function fn<Args extends unknown[], Return>(
  original: Functor<NoInfer<Args>, NoInfer<Return>>,
  ...stubs: Functor<NoInfer<Args>, NoInfer<Return>>[]
): Functor<Args, Return> & ExpectMockInstance<Args, Return>;

export function fn<Args extends unknown[], Return>(
  original?: Functor<Args, Return>,
  ...stubs: Functor<Args, Return>[]
): Functor<Args, Return> & ExpectMockInstance<Args, Return> {
  return createMockInstance(
    original,
    stubs.toReversed(),
    (call) => (...args: Args) => call(...args),
  );
}
