// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { resolveOptions, titleCaseWord } from "./_title_case_util.ts";
import type { BaseTitleCaseOptions } from "./_title_case_util.ts";
export type { BaseTitleCaseOptions };

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
export interface TitleCaseOptions extends BaseTitleCaseOptions {
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
}

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
  const opts = resolveOptions(options);
  // [3.13.2 Default Case Conversion `toTitlecase`](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G34078)
  // toTitlecase(X): Find the word boundaries in X according to Unicode Standard Annex #29, “Unicode Text Segmentation.”
  const segments = [...opts.segmenter.segment(input)];
  const words = segments.filter((x) => x.isWordLike);
  let out = "";
  let i = 0;

  const _filter = options?.filter ?? (() => true);
  const filter = typeof _filter === "function"
    ? _filter
    : excludeStopWords(_filter);

  for (const s of segments) {
    if (s.isWordLike) {
      out += filter(s, i++, words)
        ? titleCaseWord(s.segment, opts)
        : opts.force
        ? s.segment.toLocaleLowerCase(opts.locale)
        : s.segment;
    } else {
      out += s.segment;
    }
  }

  return out;
}

function excludeStopWords(stopWords: readonly string[]): WordFilter {
  const words = new Set(stopWords);
  return (s, i, w) => i === 0 || i === w.length - 1 || !words.has(s.segment);
}
