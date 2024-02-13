// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Creates a new object by excluding the specified keys from the provided object.
 *
 * @example
 * ```ts
 * import { omit } from "https://deno.land/std@$STD_VERSION/collections/omit.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/assert/assert_equals.ts";
 *
 * const obj = { a: 5, b: 6, c: 7, d: 8 };
 * const omitted = omit(obj, ["a", "c"]);
 *
 * assertEquals(omitted, { b: 6, d: 8 });
 * ```
 */
export function omit<T extends object, K extends keyof T>(
  obj: Readonly<T>,
  keys: readonly K[],
): Omit<T, K> {
  const excludes = new Set(keys);
  const has = excludes.has.bind(excludes);
  return Object.fromEntries(
    Object.entries(obj).filter(([k, _]) => !has(k as K)),
  ) as Omit<T, K>;
}
