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
 * Note: the ordering of words may change with version-updates
 * E.g. word-distance metric may change (improve)
 * use a named-distance (e.g. levenshteinDistance) to
 * guarantee a particular ordering.
 *
 * @example Basic usage
 *
 * ```ts
 * import { wordSimilaritySort } from "@std/text/word-similarity-sort";
 * import { assertEquals } from "@std/assert";
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
 * import { assertEquals } from "@std/assert";
 *
 * const possibleWords = ["length", "Size", "blah", "HELP"];
 * const suggestions = wordSimilaritySort("hep", possibleWords, { caseSensitive: true });
 *
 * assertEquals(suggestions, ["Size", "blah", "HELP", "length"]);
 * ```
 *
 * @param givenWord The string to measure distance against.
 * @param possibleWords The string-array that will be sorted. This array will
 * not be mutated, but the sorted copy will be returned.
 * @param options Options for the sort.
 * @returns A sorted copy of `possibleWords`.
 */
export function wordSimilaritySort(
  givenWord: string,
  possibleWords: ReadonlyArray<string>,
  options?: WordSimilaritySortOptions,
): string[] {
  // This distance metric could be swapped/improved in the future
  return possibleWords.toSorted(compareSimilarity(givenWord, options));
}
