// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// This module is browser compatible.

/**
 * This module provides Jest compatible expect assertion functionality.
 *
 * Currently this module supports the following functions:
 * - Common matchers:
 *   - `toBe`
 *   - `toEqual`
 *   - `toStrictEqual`
 *   - `toMatch`
 *   - `toMatchObject`
 *   - `toBeDefined`
 *   - `toBeUndefined`
 *   - `toBeNull`
 *   - `toBeNaN`
 *   - `toBeTruthy`
 *   - `toBeFalsy`
 *   - `toContain`
 *   - `toContainEqual`
 *   - `toHaveLength`
 *   - `toBeGreaterThan`
 *   - `toBeGreaterThanOrEqual`
 *   - `toBeLessThan`
 *   - `toBeLessThanOrEqual`
 *   - `toBeCloseTo`
 *   - `toBeInstanceOf`
 *   - `toThrow`
 *   - `toHaveProperty`
 *   - `toHaveLength`
 * - Mock related matchers:
 *   - `toHaveBeenCalled`
 *   - `toHaveBeenCalledTimes`
 *   - `toHaveBeenCalledWith`
 *   - `toHaveBeenLastCalledWith`
 *   - `toHaveBeenNthCalledWith`
 *   - `toHaveReturned`
 *   - `toHaveReturnedTimes`
 *   - `toHaveReturnedWith`
 *   - `toHaveLastReturnedWith`
 *   - `toHaveNthReturnedWith`
 * - Asymmetric matchers:
 *   - `expect.anything`
 *   - `expect.any`
 *   - `expect.arrayContaining`
 *   - `expect.not.arrayContaining`
 *   - `expect.closeTo`
 *   - `expect.stringContaining`
 *   - `expect.not.stringContaining`
 *   - `expect.stringMatching`
 *   - `expect.not.stringMatching`
 * - Utilities:
 *   - `expect.addEqualityTester`
 *   - `expect.extend`
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
