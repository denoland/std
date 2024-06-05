// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utility functions for working with text.
 *
 * There are various functions for manipulating text, such as `toCamelCase`:
 *
 * ```ts
 * import { toCamelCase } from "@std/text/case";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * assertEquals(toCamelCase("snake_case"), "snakeCase");
 * ```
 *
 * Or for comparing strings:
 *
 * ```ts
 * import { compareSimilarity } from "@std/text/compare-similarity";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const words = ["hi", "help", "hello"];
 *
 * // Words most similar to "hep" will be at the front
 * assertEquals(words.sort(compareSimilarity("hep")), ["help", "hi", "hello"]);
 * ```
 *
 * @module
 */

export * from "./levenshtein_distance.ts";
export * from "./closest_string.ts";
export * from "./compare_similarity.ts";
export * from "./word_similarity_sort.ts";
export * from "./case.ts";
