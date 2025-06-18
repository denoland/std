// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import _titleCaseMapping from "./title_case_mapping.json" with { type: "json" };
const titleCaseMap = new Map(Object.entries(_titleCaseMapping));

/** The case for the remaining characters in the string */
export type TrailingCase = "lower" | "unchanged";

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
   * The case to use for the remaining characters in the string:
   * - `"lower"` lowercases them, even if previously capitalized.
   * - `"unchanged"` preserves the original casing.
   *
   * @default {"lower"}
   */
  trailingCase?: TrailingCase;
}

const defaultTitleCaseOptions: Required<BaseTitleCaseOptions> = {
  locale: false,
  trailingCase: "lower",
};

type ResolvedOptions = {
  cacheKey: string;
  locale: Intl.Locale;
  trailingCase: TrailingCase;
  words: Intl.Segmenter;
  graphemes: Intl.Segmenter;
};

const optionsCache = new Map<string, ResolvedOptions>();
export function resolveOptions(opts?: BaseTitleCaseOptions): ResolvedOptions {
  const { trailingCase, locale } = { ...defaultTitleCaseOptions, ...opts };
  return resolveSerializableOptions({
    trailingCase,
    locale: new Intl.Locale(resolveLocaleOption(locale)).baseName,
  });
}

type Serializable = Record<string, string | number | boolean>;
interface SerializableOptions extends Serializable {
  locale: string;
  trailingCase: TrailingCase;
}
function resolveSerializableOptions(o: SerializableOptions): ResolvedOptions {
  const cacheKey = JSON.stringify(o);
  const cached = optionsCache.get(cacheKey);
  if (cached != null) return cached;

  // segmenters don't support `und` locale, so we use `en-US` to ensure deterministic behavior in such a case
  const segmenterLocale = o.locale === "und" ? "en-US" : o.locale;
  const vals = {
    cacheKey,
    locale: new Intl.Locale(o.locale),
    trailingCase: o.trailingCase,
    words: new Intl.Segmenter(segmenterLocale, { granularity: "word" }),
    graphemes: new Intl.Segmenter(segmenterLocale, { granularity: "grapheme" }),
  };
  optionsCache.set(cacheKey, vals);
  return vals;
}

function resolveLocaleOption(
  locale: boolean | NonNullable<Intl.LocalesArgument>,
): string {
  return locale === false
    ? "und"
    : locale === true
    ? defaultLocale()
    : Array.isArray(locale)
    // https://tc39.es/ecma402/#sec-transform-case
    // `TransformCase` always uses the first locale in the list, even if not supported by the implementation.
    ? locale[0]?.toString() ?? defaultLocale()
    : locale.toString();
}

// https://tc39.es/ecma402/#sec-defaultlocale
function defaultLocale() {
  return (globalThis.navigator?.language ??
    // Bun [currently doesn't support `navigator.language`](https://github.com/oven-sh/bun/issues/3168),
    // so we read from `NumberFormat#resolvedOptions` as a backup.
    new Intl.NumberFormat().resolvedOptions().locale)
    // Per spec, can't contain a `-u-` extension sequence (Deno's default `navigator.language` is `en-US-u-va-posix`).
    .replace(/-u-.+/, "");
}

export const CACHE_MAX_SEGMENT_LENGTH = 0x20; // max cache size for titleCaseSegment
const titleCaseCache = new Map<string, string>();
export function titleCaseSegment(
  s: string,
  opts: ResolvedOptions,
  _cache = titleCaseCache,
): string {
  // skip cache for long segments as they're highly likely to be unique
  if (s.length > CACHE_MAX_SEGMENT_LENGTH) return _titleCaseSegment(s, opts);

  // for other segments, caching is beneficial as performance can be slow otherwise
  const cacheKey = opts.cacheKey + s;
  let result = _cache.get(cacheKey);
  if (result != null) {
    // least-recently-used
    _cache.delete(cacheKey);
    _cache.set(cacheKey, result);
    return result;
  }
  result = _titleCaseSegment(s, opts);
  if (_cache.size >= 0x1000) {
    _cache.delete(_cache.keys().next().value!);
  }
  _cache.set(cacheKey, result);
  return result;
}

// https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/text/CaseMap.Title.html#adjustToCased--
// Since ICU 60, the default index adjustment is to the next character that is a letter, number, symbol, or private use
// code point. (Uncased modifier letters are skipped.)
const TARGET_CHAR_REGEXP =
  // TODO(lionel-rowe): remove deno-lint-ignore comment once https://github.com/denoland/deno_lint/issues/1442 fixed
  // deno-lint-ignore no-invalid-regexp
  /[[\p{Letter}\p{Number}\p{Symbol}\p{Private_Use}]--[\p{Modifier_Letter}--\p{Cased}]]/v;

function _titleCaseSegment(s: string, opts: ResolvedOptions): string {
  // fast path
  if (!TARGET_CHAR_REGEXP.test(s)) return s;

  let match!: Intl.SegmentData;

  for (const seg of opts.graphemes.segment(s)) {
    if (TARGET_CHAR_REGEXP.test(seg.segment)) {
      match = seg;
      break;
    }
  }

  const head = s.slice(0, match.index);
  const tail = s.slice(match.index);

  // Dutch "IJ" pair special case
  // https://github.com/unicode-org/icu4x/blob/21b7e1c0df/components/casemap/src/internals.rs#L818
  if (opts.locale.language === "nl") {
    const ijRegExp = /(?:ij(?!\u{301})|(?:(?:i\u{301}|í)j\u{301}(?!\p{M})))/iuy;
    ijRegExp.lastIndex = match.index;
    const m = ijRegExp.exec(s);

    if (m != null) {
      const [ij] = m;
      return head + ij.toLocaleUpperCase(opts.locale) +
        (opts.trailingCase === "lower"
          ? tail.toLocaleLowerCase(opts.locale)
          : tail)
          // Invariant: The length of the "ij" pair remains the same in its title/uppercased vs lowercased forms.
          .slice(ij.length);
    }
  }

  const first = titleCaseGrapheme(match.segment, opts.locale);
  if (s.length === match.index + match.segment.length) return head + first;

  const lc = opts.trailingCase === "lower"
    ? tail.toLocaleLowerCase(opts.locale)
    : tail;

  // Invariant: One input grapheme always lowercases to exactly one output grapheme (true as of Unicode 16.0.0).
  // See https://forums.swift.org/t/can-character-lowercased-return-multiple-characters/75770/17 and other comments
  // in the thread for some context (Swift's `Character` type actually corresponds to graphemes).
  const [grapheme] = opts.graphemes.segment(lc);
  return head + first + lc.slice(grapheme!.segment.length);
}

function titleCaseGrapheme(grapheme: string, locale: Intl.Locale): string {
  const [char] = grapheme;
  return titleCaseChar(char!, locale) +
    // Invariant: Lower-casing of grapheme tail never changes depending on surrounding chars (true as of Unicode 16.0.0).
    grapheme.slice(char!.length).toLocaleLowerCase(locale);
}

// Invariant: Title casing of a char never changes depending on following chars (true as of Unicode 16.0.0).
function titleCaseChar(char: string, locale: Intl.Locale): string {
  return titleCaseMap.get(char) ?? char.toLocaleUpperCase(locale);
}
