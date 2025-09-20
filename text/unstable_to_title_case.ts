// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { resolveOptions, titleCaseSegment } from "./_title_case_util.ts";
import type { BaseTitleCaseOptions } from "./_title_case_util.ts";
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export type { BaseTitleCaseOptions };
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export type { TrailingCase } from "./_title_case_util.ts";

/**
 * A function that filters words in the string. If a word returns `true` from this function, it will not be title-cased.
 * @param value The word to be filtered.
 * @param index The index of the word in the array.
 * @param array The array of words.
 * @returns `true` if the word should be excluded from title casing, `false` otherwise.
 */
export type ExcludeWordFilter = (
  value: Intl.SegmentData,
  index: number,
  array: Intl.SegmentData[],
) => boolean;

/**
 * A filter function or array of stop words to exclude them from title casing,
 * or multiple filter functions and stop word arrays to combine for filtering.
 */
export type ExcludeWordConfig =
  | ExcludeWordFilter
  | readonly string[]
  | (ExcludeWordFilter | readonly string[])[];

/** Options for {@linkcode toTitleCase} */
export interface TitleCaseOptions extends BaseTitleCaseOptions {
  /**
   * A filter function or array of stop words to exclude them from title casing,
   * or multiple filter functions and stop word arrays to combine for filtering.
   *
   * @default {() => false} (no filtering)
   */
  exclude?: ExcludeWordConfig;
}

/**
 * Converts a string into Title Case.
 *
 * > [!NOTE]
 * > This function preserves punctuation and does not insert spaces or other
 * > characters where none exist in the input (e.g. it doesn't split up
 * > `camelCase` words). This is in contrast to some other `to{X}Case`
 * > functions, such as `toSnakeCase`.
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
  const segments = [...opts.words.segment(input)];
  const words = segments.filter((x) => x.isWordLike);
  const exclude = toExcludeFilter(options?.exclude);
  let out = "";
  let i = 0;

  for (const s of segments) {
    if (s.isWordLike) {
      out += !exclude(s, i++, words)
        ? titleCaseSegment(s.segment, opts)
        : opts.trailingCase === "lower"
        ? s.segment.toLocaleLowerCase(opts.locale)
        : s.segment;
    } else {
      out += s.segment;
    }
  }

  return out;
}

function excludeStopWords(stopWords: readonly string[]): ExcludeWordFilter {
  const words = new Set(stopWords);
  return (s, i, w) => i !== 0 && i !== w.length - 1 && words.has(s.segment);
}

function toExcludeFilter(exclude?: ExcludeWordConfig): ExcludeWordFilter {
  if (exclude == null) return () => false;
  if (typeof exclude === "function") return exclude;
  if (isStrings(exclude)) return excludeStopWords(exclude);

  const filters = exclude
    .map((x) => typeof x === "function" ? x : excludeStopWords(x));

  return (s, i, w) => {
    for (const filter of filters) {
      if (filter(s, i, w)) return true;
    }
    return false;
  };
}

function isStrings(x: readonly unknown[]): x is readonly string[] {
  return typeof x[0] === "string";
}
