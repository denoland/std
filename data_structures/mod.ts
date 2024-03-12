// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Data structures for use in algorithms and other data manipulation.
 *
 * ```ts
 * import { BinarySearchTree } from "https://deno.land/std@$STD_VERSION/data_structures/mod.ts";
 *
 * const values = [3, 10, 13, 4, 6, 7, 1, 14];
 * const tree = new BinarySearchTree<number>();
 * values.forEach((value) => tree.insert(value));
 *
 * [...tree]; // [ 1, 3, 4, 6, 7, 10, 13, 14 ]
 * tree.min(); // 1
 * tree.max(); // 14
 * tree.find(42); // null
 * tree.find(7); // 7
 * tree.remove(42); // false
 * tree.remove(7); // true
 * [...tree]; // [ 1, 3, 4, 6, 10, 13, 14 ]
 * ```
 *
 * @module
 */

export * from "./binary_heap.ts";
export * from "./binary_search_tree.ts";
export * from "./comparators.ts";
export * from "./red_black_tree.ts";
