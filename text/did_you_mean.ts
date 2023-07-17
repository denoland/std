import { levenshteinDistance } from "./levenshtein_distance.ts";
import { assert } from "../testing/asserts.ts";
import { wordSimilaritySort } from "./word_similarity_sort.ts";

export class DidYouMeanError extends Error {
  override name = "DidYouMeanError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * @example
 * ```ts
 * import { assertDidYouMean } from "https://deno.land/std@$STD_VERSION/text/did_you_mean.ts";
 * const possibleWords: string[] = [ "length", "help", "Help", "size", "blah", ]
 *
 * assertDidYouMean("help", possibleWords)
 * // (no output)
 * assertDidYouMean("HELP", possibleWords)
 * // >>> DidYouMeanError(`For "HELP" did you mean one of ["help","Help","size","blah","length"]?`)
 *
 * assertDidYouMean("hep", possibleWords, { suggestionLimit: 1 })
 * // >>> DidYouMeanError(`For "hep" did you mean "help"?`)
 *
 * assertDidYouMean("HELP", possibleWords, { caseSensitiveDistance: true, suggestionLimit: 1 })
 * // >>> DidYouMeanError(`For "HELP" did you mean "Help"?`)
 * ```
 * @param {string} givenWord - The word to be checked for possible corrections.
 * @param {string[]} possibleWords - An array of possible words to compare against.
 * @param {boolean} [options.caseSensitiveDistance=false] - Flag indicating whether the spell check should be case sensitive. Default is false.
 * @param {number} [options.suggestionLimit=Infinity] - Number of suggestions to mention
 */
export function assertDidYouMean(
  givenWord: string,
  possibleWords: string[],
  options?: {
    caseSensitiveDistance?: boolean;
    suggestionLimit?: number;
  },
): any {
  const { caseSensitiveDistance, suggestionLimit } = {
    ...options,
    caseSensitiveDistance: false,
    suggestionLimit: Infinity,
  };
  assert(
    possibleWords.length > 0,
    `Call to assertDidYouMean() had empty array for possibleWords (there needs to be at least one possible word to perform a didYouMean)`,
  );
  if (!possibleWords.includes(givenWord)) {
    // try to be helpful when given an empty string
    if (givenWord.length == 0) {
      throw new DidYouMeanError(
        `An empty string was provided where one of the following strings was expected: ${
          JSON.stringify(possibleWords)
        }`,
      );
    }

    const suggestions: string[] = wordSimilaritySort(givenWord, possibleWords, {
      caseSensitive: caseSensitiveDistance,
    }).slice(0, suggestionLimit);
    if (suggestionLimit == 1) {
      throw new DidYouMeanError(
        `For ${JSON.stringify(givenWord)}, did you mean ${
          JSON.stringify(suggestions[0])
        }?`,
      );
    } else {
      throw new DidYouMeanError(
        `For ${JSON.stringify(givenWord)}, did you mean one of ${
          JSON.stringify(suggestions)
        }?`,
      );
    }
  }
}
