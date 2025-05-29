// Copyright 2014-2021 Sindre Sorhus. All rights reserved. MIT license.
// Copyright 2021 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2021 Giuseppe Eletto. All rights reserved. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Convert bytes to a human-readable string: 1337 → 1.34 kB
 *
 * Based on {@link https://github.com/sindresorhus/pretty-bytes | pretty-bytes}.
 * A utility for displaying file sizes for humans.
 *
 * ```ts
 * import { format } from "@std/fmt/bytes";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(1337), "1.34 kB");
 * assertEquals(format(100), "100 B");
 * ```
 * @module
 */

type LocaleOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Options for {@linkcode format}. */
export interface FormatOptions {
  /**
   * Uses bits representation.
   *
   * @default {false}
   */
  bits?: boolean;
  /**
   * Uses binary bytes (e.g. kibibyte).
   *
   * @default {false}
   */
  binary?: boolean;
  /**
   * Include plus sign for positive numbers.
   *
   * @default {false}
   */
  signed?: boolean;
  /**
   * Uses localized number formatting. If it is set to true, uses default
   * locale on the system. If it's set to string, uses that locale. The given
   * string should be a
   * {@link https://en.wikipedia.org/wiki/IETF_language_tag | BCP 47 language tag}.
   * You can also give the list of language tags.
   */
  locale?: boolean | string | string[];
  /**
   * The minimum number of fraction digits to display. If neither
   * {@linkcode minimumFractionDigits} or {@linkcode maximumFractionDigits}
   * are set.
   *
   * @default {3}
   */
  minimumFractionDigits?: number;
  /**
   * The maximum number of fraction digits to display. If neither
   * {@linkcode minimumFractionDigits} or {@linkcode maximumFractionDigits}
   * are set.
   *
   * @default {3}
   */
  maximumFractionDigits?: number;
}

const BINARY_UNITS = [
  "B",
  "kiB",
  "MiB",
  "GiB",
  "TiB",
  "PiB",
  "EiB",
  "ZiB",
  "YiB",
];

const DECIMAL_UNITS = [
  "B",
  "kB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
];

const BINARY_BIT_UNITS = [
  "b",
  "kibit",
  "Mibit",
  "Gibit",
  "Tibit",
  "Pibit",
  "Eibit",
  "Zibit",
  "Yibit",
];

const DECIMAL_BIT_UNITS = [
  "b",
  "kbit",
  "Mbit",
  "Gbit",
  "Tbit",
  "Pbit",
  "Ebit",
  "Zbit",
  "Ybit",
];

const LOG_1024 = Math.log(1024);

/**
 * Convert bytes to a human-readable string: 1337 → 1.34 kB
 *
 * Based on {@link https://github.com/sindresorhus/pretty-bytes | pretty-bytes}.
 * A utility for displaying file sizes for humans.
 *
 * @param num The bytes value to format
 * @param options The options for formatting
 * @returns The formatted string
 *
 * @example Basic usage
 * ```ts
 * import { format } from "@std/fmt/bytes";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(1337), "1.34 kB");
 * assertEquals(format(100), "100 B");
 * ```
 *
 * @example Include bits representation
 *
 * ```ts
 * import { format } from "@std/fmt/bytes";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(1337, { bits: true }), "1.34 kbit");
 * ```
 *
 * @example Include sign
 *
 * ```ts
 * import { format } from "@std/fmt/bytes";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(42, { signed: true }), "+42 B");
 * assertEquals(format(-42, { signed: true }), "-42 B");
 * ```
 *
 * @example Change locale
 *
 * ```ts
 * import { format } from "@std/fmt/bytes";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(1337, { locale: "de" }), "1,34 kB");
 * ```
 */
export function format(
  num: number,
  options: FormatOptions = {},
): string {
  if (!Number.isFinite(num)) {
    throw new TypeError(`Expected a finite number, got ${typeof num}: ${num}`);
  }

  const { bits = false, binary = false, signed = false, locale } = options;

  let prefix = "";
  if (num < 0) {
    prefix = "-";
    num = Math.abs(num);
  } else if (signed) {
    prefix = num === 0 ? " " : "+";
  }

  const divisor = binary ? 1024 : 1000;

  const units = binary
    ? bits ? BINARY_BIT_UNITS : BINARY_UNITS
    : bits
    ? DECIMAL_BIT_UNITS
    : DECIMAL_UNITS;

  let exponent = 0;
  if (num >= divisor) {
    const logValue = binary ? Math.log(num) / LOG_1024 : Math.log10(num) / 3;
    exponent = Math.min(Math.floor(logValue), units.length - 1);
    num /= divisor ** exponent;
  }
  const unit = units[exponent];

  const localeOptions = getLocaleOptions(options);
  if (!localeOptions) num = Number(num.toPrecision(3));
  const numberString = toLocaleString(num, locale, localeOptions);

  return `${prefix}${numberString} ${unit}`;
}

function getLocaleOptions(
  { maximumFractionDigits, minimumFractionDigits }: FormatOptions,
): LocaleOptions | undefined {
  if (
    maximumFractionDigits === undefined && minimumFractionDigits === undefined
  ) {
    return;
  }

  const ret: LocaleOptions = {};
  if (maximumFractionDigits !== undefined) {
    ret.maximumFractionDigits = maximumFractionDigits;
  }
  if (minimumFractionDigits !== undefined) {
    ret.minimumFractionDigits = minimumFractionDigits;
  }
  return ret;
}

/**
 * Formats the given number using `Number#toLocaleString`.
 * - If locale is a string, the value is expected to be a locale-key (for example: `de`).
 * - If locale is true, the system default locale is used for translation.
 * - If no value for locale is specified, the number is returned unmodified.
 */
function toLocaleString(
  num: number,
  locale: boolean | string | string[] | undefined,
  options: LocaleOptions | undefined,
): string {
  if (typeof locale === "string" || Array.isArray(locale)) {
    return num.toLocaleString(locale, options);
  } else if (locale === true || options !== undefined) {
    return num.toLocaleString(undefined, options);
  }

  return num.toString();
}
