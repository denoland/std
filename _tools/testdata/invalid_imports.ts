// Copyright 2022-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Test data for the program that checks imports in documentation.
 *
 * ```ts
 * import { a, b, c } from "file://a/b/c.ts";
 *
 * import cheese from "../../goat.ts";
 * import purr from "https://esm.sh/cat";
 * import { meow } from "../cat.js";
 * import { woof } from "./dog.mjs";
 *
 * import make, { Sound } from "https://cdn.skypack.dev/noise/mod.mjs";
 * import "https://something.somewhere";
 * import * as dotenv from "https://deno.land/std/dotenv/mod.ts";
 * import { assertEquals } from "https://deno.land/std@1.2.3/testing/asserts.ts";
 * import { walk } from "https://deno.land/std@$STD_VERSION/fs/walk.ts";
 *
 * import {
 *   x,
 *   y,
 *   z,
 * } from "https://example.com/xyz.ts";
 *
 * let s = make("some noise") as Sound;
 * ```
 *
 * * ```js
 * import deno from "land";
 * ```
 *
 * @module
 */

/**
 * Another JSDoc comment with a code block. This helps testing line number calculation.
 *
 * ```js
 * // A fake copyright notice
 *
 * import generateMockCode from "npm:@generators/mock-code";
 *
 * const a = 1;
 *
 * function imitateSome(realCode) {
 *  return generateMockCode(realCode, a);
 * }
 *
 * const deceptiveCode = imitateSome("var inception = true;");
 * ```
 */
export const a = () => {};

/**
 * A third one, just to be sure.
 *
 * ```ts
 * import something from "again";
 * ```
 */
export function b() {}
