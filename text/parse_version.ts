// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Converts a version string to a list of numeric and non-numeric segments.
 * @example
 * ```ts
 * // Example usage:
 * import { parseVersion } from "https://deno.land/std@$STD_VERSION/assert/parse_version.ts";
 * const result: Array<number | string> = versionToList("1.2.3.4.5beta");
 * console.log(result); // [1,2,3,4,5,"beta"]
 * ```
 * @param {string} version - The version string to convert.
 * @returns {Array<number | string>} - An array containing numeric and non-numeric segments.
 */
export const parseVersion = (version: string): Array<number | string> =>
  !version ? [] : version
    .split(".")
    .map((each) => each.split(/(?<=\d)(?=\D)|(?<=\D)(?=\d)/))
    .flat(1)
    .map((each) => (each.match(/^\d+$/) ? parseInt(each) : each));
