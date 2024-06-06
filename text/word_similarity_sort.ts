// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { compareSimilarity } from "./compare_similarity.ts";

/**
 * Sorts a string-array by similarity to a given string.
 *
 * @example Basic usage
 *
 * This function is case-insensitive by default.
 *
 * ```ts
 * import { wordSimilaritySort } from "@std/text/word-similarity-sort";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const possibleWords = ["length", "size", "blah", "help"];
 * const suggestions = wordSimilaritySort("hep", possibleWords).join(", ");
 *
 * assertEquals(suggestions, "help, size, blah, length");
 * ```
 *
 * @param givenWord - The string to measure distance against
 * @param possibleWords - The string-array that will be sorted
 * @param options An options bag containing a `caseSensitive` flag indicating
 * whether the distance should include case. Default is false.
 * @returns A sorted copy of possibleWords
 */
export function wordSimilaritySort(
  givenWord: string,
  possibleWords: string[],
  options?: {
    caseSensitive?: boolean;
  },
): string[] {
  const { caseSensitive } = { ...options };

  // this distance metric could be swapped/improved in the future
  return [...possibleWords].sort(
    compareSimilarity(givenWord, { caseSensitive }),
  );
}
