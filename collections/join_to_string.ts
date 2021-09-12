// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Options for joinToString
 */
export type JoinToStringOptions = {
  separator?: string;
  prefix?: string;
  suffix?: string;
};

/**
 * Transforms the elements in the given array to strings using the given selector.
 * Joins the produced strings into one using the given separator and applying the given prefix and suffix to the whole string afterwards.
 * Returns the resulting string.
 *
 * Example:
 *
 * ```ts
 * import { joinToString } from "./join_to_string.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const users = [
 *     { name: 'Kim' },
 *     { name: 'Anna' },
 *     { name: 'Tim' },
 * ];
 *
 * const message = joinToString(users,
 *     (it) => it.name,
 *     {
 *       separator: " and ",
 *       prefix: "<",
 *       suffix: ">",
 *     },
 * );
 *
 * assertEquals(message, "<Kim and Anna and Tim>");
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

  ret += suffix;

  return ret;
}
