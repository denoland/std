// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// This module is browser compatible.

/**
 * This module provides jest compatible expect assertion functionality.
 *
 * Currently this module supports the following matchers:
 * - `toBe`
 * - `toEqual`
 * - `toStrictEqual`
 * - `toMatch`
 * - `toMatchObject`
 * - `toBeDefined`
 * - `toBeUndefined`
 * - `toBeNull`
 * - `toBeNaN`
 * - `toBeTruthy`
 * - `toBeFalsy`
 * - `toContain`
 * - `toContainEqual`
 * - `toHaveLength`
 * - `toBeGreaterThan`
 * - `toBeGreaterThanOrEqual`
 * - `toBeLessThan`
 * - `toBeLessThanOrEqual`
 * - `toBeCloseTo`
 * - `toBeInstanceOf`
 * - `toThrow`
 * - `toHaveProperty`
 * - `toHaveLength`
 *
 * Also this module supports the following mock related matchers:
 * - `toHaveBeenCalled`
 * - `toHaveBeenCalledTimes`
 * - `toHaveBeenCalledWith`
 * - `toHaveBeenLastCalledWith`
 * - `toHaveBeenNthCalledWith`
 * - `toHaveReturned`
 * - `toHaveReturnedTimes`
 * - `toHaveReturnedWith`
 * - `toHaveLastReturnedWith`
 * - `toHaveNthReturnedWith`
 *
 * The following matchers are not supported yet:
 * - `toMatchSnapShot`
 * - `toMatchInlineSnapShot`
 * - `toThrowErrorMatchingSnapShot`
 * - `toThrowErrorMatchingInlineSnapShot`
 *
 * The asymmetric matchers are not fully supported yet:
 * - Supported:
 *   - `expect.anything`
 *   - `expect.any`
 *   - `expect.arrayContaining`
 *   - `expect.not.arrayContaining`
 *   - `expect.closedTo`
 *   - `expect.stringContaining`
 *   - `expect.not.stringContaining`
 *   - `expect.stringMatching`
 *   - `expect.not.stringMatching`
 * - Not supported:
 *   - `expect.objectContaining`
 *   - `expect.not.objectContaining`
 *
 * The uitlities are not fully supported yet:
 * - Supported:
 *   - `expect.addEqualityTester`
 *   - `expect.extend`
 * - Not supported:
 *   - `expect.assertions`
 *   - `expect.hasAssertions`
 *   - `expect.addSnapshotSerializer`
 *
 * This module is largely inspired by {@link https://github.com/allain/expect | x/expect} module by Allain Lalonde.
 *
 * @example
 * ```ts
 * import { expect } from "https://deno.land/std@$STD_VERSION/expect/mod.ts";
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
export { fn } from "./fn.ts";
