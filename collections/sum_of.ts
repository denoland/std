// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { Selector } from "./types.ts";

/**
 * Applies the given selector to all elements in the given collection and calculates the sum of the results
 *
 * Example:
 *
 * ```typescript
 * const people = [
 *     { name: 'Anna', age: 34 },
 *     { name: 'Kim', age: 42 },
 *     { name: 'John', age: 23 },
 * ]
 * const totalAge = sumOf(people, it => it.age)
 *
 * console.assert(totalAge, 99)
 * ```
 */
export function sumOf<T>(
    array: Array<T>,
    selector: Selector<T, number>
): number {
    return 0;
}