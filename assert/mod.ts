// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** A library of assertion functions.
 * If the assertion is false an `AssertionError` will be thrown which will
 * result in pretty-printed diff of the failing assertion.
 *
 * This module is browser compatible, but do not rely on good formatting of
 * values for AssertionError messages in browsers.
 *
 * ```ts ignore
 * import { assert } from "@std/assert";
 *
 * assert("I am truthy"); // Doesn't throw
 * assert(false); // Throws `AssertionError`
 * ```
 *
 * @module
 */

export * from "./almost_equals.ts";
export * from "./array_includes.ts";
export * from "./equals.ts";
export * from "./exists.ts";
export * from "./false.ts";
export * from "./greater_or_equal.ts";
export * from "./greater.ts";
export * from "./instance_of.ts";
export * from "./is_error.ts";
export * from "./less_or_equal.ts";
export * from "./less.ts";
export * from "./match.ts";
export * from "./not_equals.ts";
export * from "./not_instance_of.ts";
export * from "./not_match.ts";
export * from "./not_strict_equals.ts";
export * from "./object_match.ts";
export * from "./rejects.ts";
export * from "./strict_equals.ts";
export * from "./string_includes.ts";
export * from "./throws.ts";
export * from "./assert.ts";
export * from "./assertion_error.ts";
export * from "./equal.ts";
export * from "./fail.ts";
export * from "./unimplemented.ts";
export * from "./unreachable.ts";
