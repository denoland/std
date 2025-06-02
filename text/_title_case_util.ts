// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import _titleCaseMapping from "./title_case_mapping.json" with { type: "json" };
const titleCaseMapping = Object.assign(
  Object.create(null) as Partial<Record<string, string>>,
  _titleCaseMapping,
);

/** Base options for title-case functions */
export interface BaseTitleCaseOptions {
  /**
   * Uses localized case formatting. If it is set to `true`, uses default
   * locale on the system. If it's set to a specific locale, uses that locale.
   *
   * @default {false}
   */
  locale?: boolean | NonNullable<Intl.LocalesArgument>;
  /**
   * If `true`, lowercases the rest of the characters in the string, even if
   * they were previously capitalized. If `false`, keeps the original casing of
   * the rest of the characters in the string.
   *
   * @default {true}
   */
  force?: boolean;
}

const defaultTitleCaseOptions: Required<BaseTitleCaseOptions> = {
  locale: false,
  force: true,
};

type ResolvedOptions = {
  force: boolean;
  locale: Intl.LocalesArgument;
  segmenter: Intl.Segmenter;
};

export function resolveOptions(
  options: undefined | BaseTitleCaseOptions,
): ResolvedOptions {
  const opts = { ...defaultTitleCaseOptions, ...options };
  const locale = localeOptionToLocalesArgument(opts.locale);
  const segmenter = new Intl.Segmenter(locale, { granularity: "word" });

  return { ...opts, locale, segmenter };
}

function localeOptionToLocalesArgument(
  locale: boolean | NonNullable<Intl.LocalesArgument>,
): Intl.LocalesArgument {
  return locale === true ? undefined : locale === false ? "und" : locale;
}

export function titleCaseWord(word: string, opts: ResolvedOptions): string {
  // For each word boundary, find the first cased character F following the word boundary. If F exists, map F to Titlecase_Mapping(F)
  // https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G34000
  // A character C is defined to be cased if and only if C has the Lowercase or Uppercase property or has a General_Category value of Titlecase_Letter.
  const match = /[\p{Lowercase}\p{Uppercase}\p{Titlecase_Letter}]/u.exec(word);
  if (match == null) return word;

  const rest = word.slice(match.index + match[0].length);
  return word.slice(0, match.index) + titleCaseChar(match[0], opts.locale) +
    (opts.force ? rest.toLocaleLowerCase(opts.locale) : rest);
}

function titleCaseChar(char: string, locale: Intl.LocalesArgument): string {
  return titleCaseMapping[char] ?? char.toLocaleUpperCase(locale);
}
