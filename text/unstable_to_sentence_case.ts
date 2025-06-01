// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { resolveOptions, titleCaseWord } from "./_title_case_util.ts";
import type { BaseTitleCaseOptions } from "./_title_case_util.ts";
export type { BaseTitleCaseOptions };

/** Options for {@linkcode toSentenceCase} */
export interface SentenceCaseOptions extends BaseTitleCaseOptions {}

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
  const opts = resolveOptions(options);

  let out = "";
  for (const s of opts.segmenter.segment(input)) {
    if (s.isWordLike) {
      const rest = input.slice(s.index + s.segment.length);
      return out + titleCaseWord(s.segment, opts) +
        (opts.force ? rest.toLocaleLowerCase(opts.locale) : rest);
    } else {
      out += s.segment;
    }
  }

  return out;
}
