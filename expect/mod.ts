// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// This module is browser compatible.

/**
 * This module provides Jest compatible expect assertion functionality.
 *
 * Currently this module supports the following functions:
 * - Common matchers:
 *   - [`toBe`](./doc/~/Expected.toBe)
 *   - [`toEqual`](./doc/~/Expected.toEqual)
 *   - [`toStrictEqual`](./doc/~/Expected.toStrictEqual)
 *   - [`toMatch`](./doc/~/Expected.toMatch)
 *   - [`toMatchObject`](./doc/~/Expected.toMatchObject)
 *   - [`toBeDefined`](./doc/~/Expected.toBeDefined)
 *   - [`toBeUndefined`](./doc/~/Expected.toBeUndefined)
 *   - [`toBeNull`](./doc/~/Expected.toBeNull)
 *   - [`toBeNaN`](./doc/~/Expected.toBeNaN)
 *   - [`toBeTruthy`](./doc/~/Expected.toBeTruthy)
 *   - [`toBeFalsy`](./doc/~/Expected.toBeFalsy)
 *   - [`toContain`](./doc/~/Expected.toContain)
 *   - [`toContainEqual`](./doc/~/Expected.toContainEqual)
 *   - [`toHaveLength`](./doc/~/Expected.toHaveLength)
 *   - [`toBeGreaterThan`](./doc/~/Expected.toBeGreaterThan)
 *   - [`toBeGreaterThanOrEqual`](./doc/~/Expected.toBeGreaterThanOrEqual)
 *   - [`toBeLessThan`](./doc/~/Expected.toBeLessThan)
 *   - [`toBeLessThanOrEqual`](./doc/~/Expected.toBeLessThanOrEqual)
 *   - [`toBeCloseTo`](./doc/~/Expected.toBeCloseTo)
 *   - [`toBeInstanceOf`](./doc/~/Expected.toBeInstanceOf)
 *   - [`toThrow`](./doc/~/Expected.toThrow)
 *   - [`toHaveProperty`](./doc/~/Expected.toHaveProperty)
 *   - [`toHaveLength`](./doc/~/Expected.toHaveLength)
 * - Mock related matchers:
 *   - [`toHaveBeenCalled`](./doc/~/Expected.toHaveBeenCalled)
 *   - [`toHaveBeenCalledTimes`](./doc/~/Expected.toHaveBeenCalledTimes)
 *   - [`toHaveBeenCalledWith`](./doc/~/Expected.toHaveBeenCalledWith)
 *   - [`toHaveBeenLastCalledWith`](./doc/~/Expected.toHaveBeenLastCalledWith)
 *   - [`toHaveBeenNthCalledWith`](./doc/~/Expected.toHaveBeenNthCalledWith)
 *   - [`toHaveReturned`](./doc/~/Expected.toHaveReturned)
 *   - [`toHaveReturnedTimes`](./doc/~/Expected.toHaveReturnedTimes)
 *   - [`toHaveReturnedWith`](./doc/~/Expected.toHaveReturnedWith)
 *   - [`toHaveLastReturnedWith`](./doc/~/Expected.toHaveLastReturnedWith)
 *   - [`toHaveNthReturnedWith`](./doc/~/Expected.toHaveNthReturnedWith)
 * - Asymmetric matchers:
 *   - [`expect.anything`](./doc/~/expect.anything)
 *   - [`expect.any`](./doc/~/expect.any)
 *   - [`expect.arrayContaining`](./doc/~/expect.arrayContaining)
 *   - `expect.not.arrayContaining`
 *   - [`expect.closeTo`](./doc/~/expect.closeTo)
 *   - [`expect.stringContaining`](./doc/~/expect.stringContaining)
 *   - `expect.not.stringContaining`
 *   - [`expect.stringMatching`](./doc/~/expect.stringMatching)
 *   - `expect.not.stringMatching`
 * - Utilities:
 *   - [`expect.addEqualityTester`](./doc/~/expect.addEqualityTester)
 *   - [`expect.extend`](./doc/~/expect.extend)
 *
 * Only these functions are still not available:
 * - Matchers:
 *   - `toMatchSnapShot`
 *   - `toMatchInlineSnapShot`
 *   - `toThrowErrorMatchingSnapShot`
 *   - `toThrowErrorMatchingInlineSnapShot`
 * - Asymmetric matchers:
 *   - `expect.objectContaining`
 *   - `expect.not.objectContaining`
 * - Utilities:
 *   - `expect.assertions`
 *   - `expect.hasAssertions`
 *   - `expect.addSnapshotSerializer`
 *
 * This module is largely inspired by
 * {@link https://github.com/allain/expect | x/expect} module by Allain Lalonde.
 *
 * ```ts no-assert
 * import { expect } from "@std/expect";
 *
 * const x = 6 * 7;
 * expect(x).toEqual(42);
 * expect(x).not.toEqual(0);
 *
 * await expect(Promise.resolve(x)).resolves.toEqual(42);
 * ```
 *
 * @module
 */
export { expect } from "./expect.ts";
export type { AnyConstructor, Async, Expected } from "./expect.ts";
export { fn } from "./fn.ts";
