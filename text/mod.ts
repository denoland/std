// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @module
 * Utility functions for working with text.
 *
 * There are various functions for manipulating text, such as `toCamelCase`:
 *
 * ```ts
 * import { toCamelCase } from "@std/text/case";
 *
 * console.log(toCamelCase("snake_case")); // "snakeCase"
 * ```
 *
 * Or for comparing strings:
 *
 * ```ts
 * import { compareSimilarity } from "@std/text/compare-similarity";
 * const words = ["hi", "hello", "help"];
 *
 * // words most-similar to "hep" will be at the front
 * words.sort(compareSimilarity("hep"));
 * ```
 *
 * This module is browser compatible.
 */

export * from "./levenshtein_distance.ts";
export * from "./closest_string.ts";
export * from "./compare_similarity.ts";
export * from "./word_similarity_sort.ts";
export * from "./case.ts";
