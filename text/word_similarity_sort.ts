// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import {
  compareSimilarity,
  type CompareSimilarityOptions,
} from "./compare_similarity.ts";

/** Options for {@linkcode wordSimilaritySort}. */
export interface WordSimilaritySortOptions extends CompareSimilarityOptions {}

/**
 * Sorts a string-array by similarity to a given string.
 *
 * @example Basic usage
 *
 * ```ts
 * import { wordSimilaritySort } from "@std/text/word-similarity-sort";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const possibleWords = ["length", "size", "blah", "help"];
 * const suggestions = wordSimilaritySort("hep", possibleWords);
 *
 * assertEquals(suggestions, ["help", "size", "blah", "length"]);
 * ```
 *
 * @example Case-sensitive sorting
 *
 * ```ts
 * import { wordSimilaritySort } from "@std/text/word-similarity-sort";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const possibleWords = ["length", "Size", "blah", "HELP"];
 * const suggestions = wordSimilaritySort("hep", possibleWords, { caseSensitive: true });
 *
 * assertEquals(suggestions, ["Size", "blah", "HELP", "length"]);
 * ```
 *
 * @param givenWord The string to measure distance against.
 * @param possibleWords The string-array that will be sorted.
 * @param options Options for the sort.
 * @returns A sorted copy of possibleWords.
 */
export function wordSimilaritySort(
  givenWord: string,
  possibleWords: string[],
  options?: WordSimilaritySortOptions,
): string[] {
  // This distance metric could be swapped/improved in the future
  return [...possibleWords].sort(
    compareSimilarity(givenWord, options),
  );
}
