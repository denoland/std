// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// This module is browser compatible.

/**
 * This module provides Jest compatible expect assertion functionality.
 *
 * Currently this module supports the following functions:
 * - Common matchers:
 *   - {@linkcode Expected.toBe | toBe}
 *   - {@linkcode Expected.toEqual | toEqual}
 *   - {@linkcode Expected.toStrictEqual | toStrictEqual}
 *   - {@linkcode Expected.toMatch | toMatch}
 *   - {@linkcode Expected.toMatchObject | toMatchObject}
 *   - {@linkcode Expected.toBeDefined | toBeDefined}
 *   - {@linkcode Expected.toBeUndefined | toBeUndefined}
 *   - {@linkcode Expected.toBeNull | toBeNull}
 *   - {@linkcode Expected.toBeNaN | toBeNaN}
 *   - {@linkcode Expected.toBeTruthy | toBeTruthy}
 *   - {@linkcode Expected.toBeFalsy | toBeFalsy}
 *   - {@linkcode Expected.toContain | toContain}
 *   - {@linkcode Expected.toContainEqual | toContainEqual}
 *   - {@linkcode Expected.toHveLength | toHaveLength}
 *   - {@linkcode Expected.toBeGreaterThan | toBeGreaterThan}
 *   - {@linkcode Expected.toBeGreaterThanOrEqual | toBeGreaterThanOrEqual}
 *   - {@linkcode Expected.toBeLessThan | toBeLessThan}
 *   - {@linkcode Expected.toBeLessThanOrEqual | toBeLessThanOrEqual}
 *   - {@linkcode Expected.toBeCloseTo | toBeCloseTo}
 *   - {@linkcode Expected.toBeInstanceOf | toBeInstanceOf}
 *   - {@linkcode Expected.toThrow | toThrow}
 *   - {@linkcode Expected.toHaveProperty | toHaveProperty}
 * - Mock related matchers:
 *   - {@linkcode Expected.toHaveBeenCalled | toHaveBeenCalled}
 *   - {@linkcode Expected.toHaveBeenCalledTimes | toHaveBeenCalledTimes}
 *   - {@linkcode Expected.toHaveBeenCalledWith | toHaveBeenCalledWith}
 *   - {@linkcode Expected.toHaveBeenLastCalledWith | toHaveBeenLastCalledWith}
 *   - {@linkcode Expected.toHaveBeenNthCalledWith | toHaveBeenNthCalledWith}
 *   - {@linkcode Expected.toHaveReturned | toHaveReturned}
 *   - {@linkcode Expected.toHaveReturnedTimes | toHaveReturnedTimes}
 *   - {@linkcode Expected.toHaveReturnedWith | toHaveReturnedWith}
 *   - {@linkcode Expected.toHaveLastReturnedWith | toHaveLastReturnedWith}
 *   - {@linkcode Expected.toHaveNthReturnedWith | toHaveNthReturnedWith}
 * - Asymmetric matchers:
 *   - {@linkcode expect.anything}
 *   - {@linkcode expect.any}
 *   - {@linkcode expect.arrayContaining}
 *   - {@linkcode expect.closeTo}
 *   - {@linkcode expect.stringContaining}
 *   - {@linkcode expect.stringMatching}
 * - Utilities:
 *   - {@linkcode expect.addEqualityTester}
 *   - {@linkcode expect.extend}
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
