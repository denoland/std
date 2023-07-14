/**
 * Calculates the Levenshtein distance between two strings.
 *
 * @param {string} str1 - The first string.
 * @param {string} str2 - The second string.
 * @returns {number} The Levenshtein distance between the two strings.
 */
export function levenshteinDistance(str1: string, str2: string): number {
    if (str1.length > str2.length) {
        ;[str1, str2] = [str2, str1]
    }

    let distances: number[] = Array.from({ length: str1.length + 1 }, (_, i) => +i)
    for (let str2Index = 0; str2Index < str2.length; str2Index++) {
        const tempDistances: number[] = [str2Index + 1]
        for (let str1Index = 0; str1Index < str1.length; str1Index++) {
            let char1 = str1[str1Index]
            let char2 = str2[str2Index]
            if (char1 === char2) {
                tempDistances.push(distances[str1Index])
            } else {
                tempDistances.push(1 + Math.min(distances[str1Index], distances[str1Index + 1], tempDistances[tempDistances.length - 1]))
            }
        }
        distances = tempDistances
    }
    return distances[distances.length - 1]
}

/**
 * Determines possible correct spellings for a given word based on a list of possible words.
 *
 * @example
 * ```ts
 * const possibleWords: string[] = [ "length", "size", "blah", "help", ]
 * const badArg = "hep"
 *
 * // manual check
 * if (!possibleWords.includes(badArg)) {
 *   const suggestions = didYouMean({ guessWord: badArg, possibleWords }).join(", ")
 *   throw new Error(`${badArg} isn't a valid argument, did you mean one of ${suggestions}?`)
 * }
 *
 * // auto-throw (performs case-insensitive check)
 * didYouMean({ guessWord: badArg, possibleWords, autoThrow: true, suggestionLimit: 1 })
 * // >>> Error(`For "hep" did you "help"?`)
 *
 * // no suggestionLimit
 * didYouMean({ guessWord: badArg, possibleWords, autoThrow: true })
 * // >>> Error(`For "hep" did you mean one of [ "help", "size", "blah", "length", ]?`)
 *
 * ```
 *
 * @param {Object} options - The options for spell checking.
 * @param {string} options.guessWord - The word to be checked for possible corrections.
 * @param {string[]} options.possibleWords - An array of possible words to compare against.
 * @param {boolean} [options.caseSensitive=false] - Flag indicating whether the spell check should be case sensitive. Default is false.
 * @param {boolean} [options.autoThrow=false] - Flag for throwing automatically if the word is not a direct match
 * @param {number} [options.suggestionLimit=Infinity] - Number of results to return
 * @returns {string[]} An array of possible correct spellings for the given word.
 */
export function didYouMean(
    guessWord: string,
    possibleWords: string[],
    {
        caseSensitive = false,
        autoThrow = false,
        suggestionLimit = Infinity,
    }: {
        caseSensitive?: boolean
        suggestionLimit?: number
        autoThrow?: boolean
    }
): string[] {
    if (!caseSensitive) {
        possibleWords = possibleWords.map((each) => each.toLowerCase())
        guessWord = guessWord.toLowerCase()
    }
    if (!possibleWords.includes(guessWord) && autoThrow) {
        let suggestions: string[] = didYouMean({
            guessWord,
            possibleWords,
            caseSensitive,
            suggestionLimit,
        })
        if (suggestionLimit == 1 && suggestions.length > 0) {
            throw new Error(`For ${JSON.stringify(guessWord)}, did you mean ${JSON.stringify(suggestions[0])}?`)
        } else {
            throw new Error(`For ${JSON.stringify(guessWord)}, did you mean one of ${JSON.stringify(suggestions)}?`)
        }
    }
    // this distance metric could be swapped/improved in the future
    return [...possibleWords].sort((a, b) => levenshteinDistance(guessWord, a) - levenshteinDistance(guessWord, b)).slice(0, suggestionLimit)
}