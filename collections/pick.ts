// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Creates a new object by including the specified keys from the provided object.
 *
 * @example
 * ```ts
 * import { pick } from "https://deno.land/std@$STD_VERSION/collections/pick.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 *
 * const obj = { a: 5, b: 6, c: 7, d: 8 };
 * const picked = pick(obj, ["a", "c"]);
 *
 * assertEquals(picked, { a: 5, c: 7 });
 * ```
 */
export function pick<T extends object, K extends keyof T>(
  obj: Readonly<T>,
  keys: readonly K[],
): Pick<T, K> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, K>;
}
