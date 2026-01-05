// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Checks if the actual type `A` is assignable to the expected type `E`, and
 * vice versa.
 *
 * This is often less strict than `IsExact` because the two type parameters are
 * allowed to have a different structure as long as they are assignable to each
 * other. This is often more strict than `Has` because none of the two type
 * parameters may be a union that contains the other, as this would fail the
 * check for mutual assignability.
 *
 * @example Usage
 * ```ts
 * import { assertType } from "@std/testing/types";
 * import type { IsMutuallyAssignable } from "@std/testing/unstable-types";
 *
 * // false because E is not assignable to A
 * assertType<IsMutuallyAssignable<string & RegExpMatchArray, string>>(false);
 * // false because A is not assignable to E
 * assertType<IsMutuallyAssignable<string | RegExpMatchArray, string>>(false);
 * // true because both types are assignable to each other
 * assertType<IsMutuallyAssignable<string | (string & RegExpMatchArray), string>>(true);
 * ```
 */
export type IsMutuallyAssignable<A, E> = [E] extends [A]
  ? [A] extends [E] ? true : false
  : false;
