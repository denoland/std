import { levenshteinDistance } from "./levenshtein_distance.ts";

/**
 * Sorts a string-array by similarity to a given string
 *
 * @example
 * ```ts
 * import { wordSimilaritySort } from "https://deno.land/std@$STD_VERSION/text/word_similarity_sort.ts";
 * 
 * const possibleWords: string[] = [ "length", "size", "blah", "help", ]
 *
 * // case-insensitve by default
 * const suggestions = wordSimilaritySort("hep", possibleWords).join(", ")
 *
 * // force case sensitive 
 * wordSimilaritySort("hep", possibleWords, { caseSensitive: true })
 * ```
 *
 * @param {string} givenWord - The string to measure distance against
 * @param {string[]} possibleWords - The string-array that will be sorted
 * @param {boolean} [options.caseSensitive=false] - Flag indicating whether the distance should include case. Default is false.
 * @returns {string[]} A sorted copy of possibleWords
 */
export function wordSimilaritySort(
  givenWord: string,
  possibleWords: string[],
  options: null| {
    caseSensitive?: boolean;
  },
): string[] {
  const { caseSensitive } = {...options}
  let compare
  if (!caseSensitive) {
    givenWord = givenWord.toLowerCase();
    compare = (a, b) => levenshteinDistance(givenWord, a.toLowerCase()) - levenshteinDistance(givenWord, b.toLowerCase())
  } else {
    compare = (a, b) => levenshteinDistance(givenWord, a) - levenshteinDistance(givenWord, b)
  }
  
  // this distance metric could be swapped/improved in the future
  return [...possibleWords].sort(compare);
}