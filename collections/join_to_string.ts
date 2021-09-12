// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * JoinToString
 */
export type JoinToStringOptions = {
  separator?: string;
  prefix?: string;
  suffix?: string;
};

/**
 * Transforms the elements in the given array to strings using the given selector. Joins the produced strings into one using the given separator and applying the given prefix and suffix to the whole string afterwards. Returns the resulting string.
 *
 * Example:
 *
 * ```ts
 * import { joinToString } from "./join_to_string.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const users = [
 *     { name: 'Kim', age: 22 },
 *     { name: 'Anna', age: 31 },
 *     { name: 'Tim', age: 58 },
 * ];
 *
 * const names = joinToString(users,
 *     (it) => it.name,
 *     {
 *         separator = " and ",
 *         prefix = "<",
 *         suffix = ">",
 *  }
 * )
 *
 * assertEquals(names, "<Kim and Anna and Tim>")
 * ```
 */
export function joinToString<T>(
  array: readonly T[],
  selector: (el: T) => string,
  {
    separator = ", ",
    prefix = "",
    suffix = "",
  }: Readonly<JoinToStringOptions> = {},
): string {
  let ret = prefix;

  array.forEach((it, index) => {
    if (index > 0) {
      ret += separator;
    }

    ret += selector(it);
  });

  return (ret += suffix);
}
