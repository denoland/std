// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Applies the given selector to all elements in the given collection and returns the max of it
 *
 * Example:
 *
 * ```ts
 * import { sumOf } from "./sum_of.ts"
 * import { assertEquals } from "../testing/asserts.ts"
 *
 * const inventory = [
 *      { name: "mustard", count: 2 },
 *      { name: "soy", count: 4 },
 *      { name: "tomato", count: 32 },
 *  ];
 * const maxItem = maxOf(inventory, (i) => i.count);
 * 
 * assertEquals(maxItem, 32);
 * ```
 */

export function maxOf<T>(
    array: readonly T[],
    selector: (el: T) => number,
): number {
    let maxOf = -Infinity;
    
    for (const i of array) {
        if (selector(i) > maxOf) {
            maxOf = selector(i);
        } 
        else if (Number.isNaN(selector(i))) {
            return maxOf = NaN
        }
    }
    
    return maxOf;
}