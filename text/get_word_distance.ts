import { levenshteinDistance } from "./levenshtein_distance.ts";

/**
 * Compare two strings by similarity.

 * Currently exports {@linkcode levenshteinDistance}.
 * Metric used may be swapped / improved in the future.
 *
 * @returns The difference in distance. Lower number means closer match.
 * 0 means numbers match.
 */
export const getWordDistance = levenshteinDistance;
