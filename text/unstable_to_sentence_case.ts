// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { resolveOptions, titleCaseSegment } from "./_title_case_util.ts";
import type { BaseTitleCaseOptions } from "./_title_case_util.ts";
export type { BaseTitleCaseOptions };

/** Options for {@linkcode toSentenceCase} */
export interface SentenceCaseOptions extends BaseTitleCaseOptions {}

/**
 * Converts a string into Sentence Case.
 *
 * > [!NOTE]
 * > This function preserves punctuation and does not insert spaces or other
 * > characters where none exist in the input (e.g. it doesn't split up
 * > `camelCase` words). This is in contrast to some other `to{X}Case`
 * > functions, such as `toSnakeCase`.
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
  return titleCaseSegment(input, resolveOptions(options));
}
