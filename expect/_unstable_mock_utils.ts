// Copyright 2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2024 Anton Mikhailov. All rights reserved. MIT License.

import type { MOCK_SYMBOL, MockCall } from "@std/internal/unstable_mock";

export { isMockFunction, MOCK_SYMBOL } from "@std/internal/unstable_mock";

export type ExpectMockCall<Args extends unknown[], Return> = Omit<
  MockCall<Args, Return>,
  "returned"
> & {
  timestamp: number;
  returned?: Return | undefined;
};
export interface ExpectMockInternals<Args extends unknown[], Return> {
  calls: ExpectMockCall<Args, Return>[];
}
export interface ExpectMockInstance<Args extends unknown[], Return> {
  [MOCK_SYMBOL]: ExpectMockInternals<Args, Return>;

  /**
   * Sets current implementation.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn().mockImplementation((a: number, b: number) => a + b);
   *   expect(mockFn()).toEqual(3);
   * });
   * ```
   */
  mockImplementation(stub: (...args: Args) => Return): this;

  /**
   * Adds one time stub implementation.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockImplementationOnce((a, b) => a - b);
   *   expect(mockFn(1, 2)).toEqual(-1);
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  mockImplementationOnce(stub: (...args: Args) => Return): this;

  /**
   * Sets current implementation's return value.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn().mockReturnValue(5);
   *   expect(mockFn(1, 2)).toEqual(5);
   * });
   * ```
   */
  mockReturnValue(value: Return): this;

  /**
   * Adds one time stub implementation that returns provided value.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockReturnValueOnce(5);
   *   expect(mockFn(1, 2)).toEqual(5);
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  mockReturnValueOnce(value: Return): this;

  /**
   * Sets current implementation's that returns promise resolved to value.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", async () => {
   *   const mockFn = fn();
   *   mockFn.mockResolvedValue(5);
   *   await expect(mockFn(1, 2)).resolves.toEqual(5);
   *   expect(mockFn(3, 2)).toEqual(5);
   * });
   * ```
   */
  mockResolvedValue(value: Awaited<Return> | Return): this;

  /**
   * Adds one time stub implementation that returns promise resolved to value.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", async () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockResolvedValueOnce(5);
   *   await expect(mockFn(1, 2)).resolves.toEqual(5);
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  mockResolvedValueOnce(value: Awaited<Return> | Return): this;

  /**
   * Sets current implementation's that returns promise rejects with reason.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", async () => {
   *   const mockFn = fn();
   *   mockFn.mockRejectedValue(new Error("test error"));
   *   await expect(mockFn(1, 2)).rejects.toThrow("test error");
   *   expect(mockFn(3, 2)).toEqual(5);
   * });
   * ```
   */
  mockRejectedValue(reason?: unknown): this;

  /**
   * Adds one time stub implementation that returns promise rejects with reason.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", async () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockRejectedValueOnce(new Error("test error"));
   *   await expect(mockFn(1, 2)).rejects.toThrow("test error");
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  mockRejectedValueOnce(reason?: unknown): this;

  /**
   * Changes current implementation to provided stub.
   * Returns disposable resource that restores previous setup of stubs on dispose.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockReturnValueOnce(5);
   *   {
   *     using withMock = mockFn.withImplementation((a, b) => a - b);
   *     expect(mockFn(1, 2)).toEqual(-1);
   *   }
   *   expect(mockFn(1, 2)).toEqual(5);
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  withImplementation(stub: (...args: Args) => Return): Disposable;

  /**
   * Changes current implementation to provided stub.
   * Runs scope function and after it is final restores previous setup of stubs.
   * Also detects if scope function returns a promise and waits for it to resolve.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", async () => {
   *   const mockFn = fn((a: number, b: number) => a + b);
   *   mockFn.mockReturnValueOnce(5);
   *   await mockFn.withImplementation(async (a, b) => a - b, async () => {
   *     await expect(mockFn(1, 2)).resolves.toEqual(-1);
   *   });
   *   expect(mockFn(1, 2)).toEqual(5);
   *   expect(mockFn(1, 2)).toEqual(3);
   * });
   * ```
   */
  withImplementation<ScopeResult>(
    stub: (...args: Args) => Return,
    scope: () => ScopeResult
  ): ScopeResult;

  /**
   * Restores original implementation and discards one time stubs.
   * In case no original implementation was provided, the mock will be reset to an empty function.
   *
   * @example Usage
   * ```ts
   * import { fn, expect } from "@std/expect";
   *
   * Deno.test("example", () => {
   *   const mockFn = fn((a: number, b: number) => a + b).mockReturnValue(5).mockReturnValueOnce(1);
   *   mockFn.mockRestore();
   *   expect(mockFn()).toEqual(3);
   *   expect(mockFn()).toEqual(3);
   * });
   * ```
   */
  mockRestore(): void;
}
