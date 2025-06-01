// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { titleCaseSegments } from "./_title_case_util.ts";

/** Options for {@linkcode toSentenceCase} */
export type SentenceCaseOptions = {
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
};

/**
 * Converts a string into Sentence Case.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string that is going to be converted into Sentence Case
 * @param options Optional settings to customize the conversion
 * @returns The string as Sentence Case
 *
 * @example Usage
 * ```ts
 * import { toSentenceCase } from "@std/text/unstable-to-sentence-case";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(toSentenceCase("deno is awesome"), "Deno is awesome");
 * ```
 */
export function toSentenceCase(
  input: string,
  options?: SentenceCaseOptions,
): string {
  return [...titleCaseSegments(input, options, true)].join("");
}
