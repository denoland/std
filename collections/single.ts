// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns an element if and only if that element is the only one matching the given condition. Returns `undefined` otherwise.
 *
 * Example:
 *
 * ```ts
 * import { single } from "./single.ts";
 * import { assertEquals } from "../testing/asserts.ts";
 *
 * const bookings = [
 *     { month: 'January', active: false },
 *     { month: 'March', active: false },
 *     { month: 'June', active: true },
 * ];
 * const activeBooking = single(bookings, (it) => it.active);
 * const inactiveBooking = single(bookings, (it) => !it.active);
 *
 * assertEquals(activeBooking, { month: "June", active: true });
 * assertEquals(inactiveBooking, undefined); // there are two applicable items
 * ```
 */
export function single<T>(
  array: readonly T[],
  predicate: (el: T) => boolean = (_) => true,
): T | undefined {
  let match: T | undefined = undefined;
  for (const element of array) {
    if (predicate(element)) {
      if (match !== undefined) {
        return undefined;
      }
      match = element;
    }
  }

  return match;
}
