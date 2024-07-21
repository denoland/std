// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// This module is browser compatible.

/**
 * This module provides Jest compatible expect assertion functionality.
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
 * See {@linkcode Expected} for the list of supported matchers.
 *
 * The tracking issue to add support for unsupported parts of the API is
 * {@link https://github.com/denoland/std/issues/3964}.
 *
 * This module is largely inspired by
 * {@link https://github.com/allain/expect | x/expect} module by
 * {@link https://github.com/allain | Allain Lalonde}.
 *
 * @module
 */
export * from "./expect.ts";
export { fn } from "./fn.ts";
