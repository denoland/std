// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import _titleCaseMapping from "./title_case_mapping.json" with { type: "json" };
import type { TitleCaseOptions, WordFilter } from "./unstable_to_title_case.ts";

const titleCaseMapping = Object.assign(
  Object.create(null) as Partial<Record<string, string>>,
  _titleCaseMapping,
);

const defaultTitleCaseOptions: Required<TitleCaseOptions> = {
  locale: false,
  force: true,
  filter: () => true,
};

type ResolvedOptions = Omit<Required<TitleCaseOptions>, "locale"> & {
  locale: Intl.LocalesArgument;
  segmenter: Intl.Segmenter;
};

const UNDEFINED = Symbol("undefined");
const cache = new WeakMap<
  TitleCaseOptions | typeof UNDEFINED,
  ResolvedOptions
>();
function resolveOptions(
  options: undefined | TitleCaseOptions,
): ResolvedOptions {
  const key = options ?? UNDEFINED;
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const opts = { ...defaultTitleCaseOptions, ...options };
  const locale = localeOptionToLocalesArgument(opts.locale);

  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
  const resolved = { ...opts, locale, segmenter };

  cache.set(key, resolved);
  return resolved;
}

function localeOptionToLocalesArgument(
  locale: boolean | NonNullable<Intl.LocalesArgument>,
): Intl.LocalesArgument {
  switch (locale) {
    case true:
      return undefined; // system-default locale
    case false:
      return "und"; // Locale-agnostic "und"
    default:
      return locale; // The specified locale
  }
}

export function* titleCaseSegments(
  input: string,
  options: TitleCaseOptions | undefined,
  firstWordOnly: boolean,
) {
  let { segmenter, force, locale, filter } = resolveOptions(options);
  // [3.13.2 Default Case Conversion `toTitlecase`](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G34078)
  // toTitlecase(X): Find the word boundaries in X according to Unicode Standard Annex #29, “Unicode Text Segmentation.”
  const segments = [...segmenter.segment(input)];
  const words = segments.filter((x) => x.isWordLike);

  if (typeof filter !== "function") {
    filter = excludeStopWords(filter);
  }

  let i = 0;
  for (const s of segments) {
    if (s.isWordLike) {
      yield filter(s, i++, words)
        ? titleCaseWord(s.segment, options)
        : force
        ? s.segment.toLocaleLowerCase(locale)
        : s.segment;

      if (firstWordOnly) {
        const rest = input.slice(s.index + s.segment.length);
        yield force ? rest.toLocaleLowerCase(locale) : rest;
        return;
      }
    } else {
      yield s.segment;
    }
  }
}

function titleCaseWord(
  word: string,
  options?: TitleCaseOptions,
): string {
  const { force, locale } = resolveOptions(options);

  // For each word boundary, find the first cased character F following the word boundary. If F exists, map F to Titlecase_Mapping(F)
  // https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G34000
  // A character C is defined to be cased if and only if C has the Lowercase or Uppercase property or has a General_Category value of Titlecase_Letter.
  const match = /[\p{Lowercase}\p{Uppercase}\p{Titlecase_Letter}]/u.exec(word);
  if (match == null) return word;

  const rest = word.slice(match.index + match[0].length);
  return word.slice(0, match.index) + titleCaseChar(match[0], locale) +
    (force ? rest.toLocaleLowerCase(locale) : rest);
}

function titleCaseChar(char: string, locale: Intl.LocalesArgument): string {
  return titleCaseMapping[char] ?? char.toLocaleUpperCase(locale);
}

function excludeStopWords(stopWords: readonly string[]): WordFilter {
  const words = new Set(stopWords);
  return (s, i, w) => i === 0 || i === w.length - 1 || !words.has(s.segment);
}
