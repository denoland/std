// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { titleCaseSegments } from "./_title_case_util.ts";

/**
 * A function that filters words in the string. If a word returns `false` from this function, it will not be title-cased.
 * @param value The word to be filtered.
 * @param index The index of the word in the array.
 * @param array The array of words.
 * @returns `true` if the word should be title-cased, `false` otherwise.
 */
export type WordFilter = (
  value: Intl.SegmentData,
  index: number,
  array: Intl.SegmentData[],
) => boolean;

/** Options for {@linkcode toTitleCase} */
export type TitleCaseOptions = {
  /**
   * Uses localized case formatting. If it is set to `true`, uses default
   * locale on the system. If it's set to a specific locale, uses that locale.
   *
   * @default {false}
   */
  locale?: boolean | NonNullable<Intl.LocalesArgument>;
  /**
   * If `true`, lowercases the rest of the words in the string, even if they
   * are already capitalized. If `false`, keeps the original casing of the
   * rest of the words in the string.
   *
   * @default {true}
   */
  force?: boolean;
  /**
   * A function that filters words in the string. If a word returns `false`
   * from this function, it will not be title-cased.
   *
   * Alternatively, you can pass an array of strings to filter out specific
   * words.
   *
   * @default {() => true} (no filtering)
   */
  filter?: WordFilter | readonly string[];
};

/**
 * Converts a string into Title Case.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string that is going to be converted into Title Case
 * @param options Optional settings to customize the conversion
 * @returns The string as Title Case
 *
 * @example Usage
 * ```ts
 * import { toTitleCase } from "@std/text/unstable-to-title-case";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(toTitleCase("deno is awesome"), "Deno Is Awesome");
 * ```
 */
export function toTitleCase(input: string, options?: TitleCaseOptions): string {
  return [...titleCaseSegments(input, options, false)].join("");
}
