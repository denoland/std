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
  const match = /[\p{Cased}]/u.exec(word);
  if (match == null) return word;

  const before = word.slice(0, match.index);
  const cased = word.slice(match.index);
  const first = titleCaseChar(cased, opts.locale);
  const _rest = opts.force ? cased.toLocaleLowerCase(opts.locale) : cased;
  const rest = _rest.slice(_rest[Symbol.iterator]().next().value?.length ?? 0);

  return before + first + rest;
}

function titleCaseChar(word: string, locale: Intl.LocalesArgument): string {
  // assert(word.length);
  const [char] = word;
  return titleCaseMapping[char!] ??
    word.toLocaleUpperCase(locale)[Symbol.iterator]().next().value ?? "";
}
