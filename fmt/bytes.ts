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
interface Unit {
  long: string;
  short: string;
  altShort?: string;
  magnitude: number;
}

const BINARY_BYTE_UNITS: Unit[] = [
  { long: "byte", short: "B", magnitude: 1 },
  { long: "kibibyte", short: "KiB", altShort: "kiB", magnitude: 2 ** 10 },
  { long: "mebibyte", short: "MiB", magnitude: 2 ** 20 },
  { long: "gibibyte", short: "GiB", magnitude: 2 ** 30 },
  { long: "tebibyte", short: "TiB", magnitude: 2 ** 40 },
  { long: "pebibyte", short: "PiB", magnitude: 2 ** 50 },
  { long: "exbibyte", short: "EiB", magnitude: 2 ** 60 },
  { long: "zebibyte", short: "ZiB", magnitude: 2 ** 70 },
  { long: "yobibyte", short: "YiB", magnitude: 2 ** 80 },
];

const BINARY_BIT_UNITS: Unit[] = [
  { long: "bit", short: "b", magnitude: 1 },
  { long: "kibibit", short: "Kib", altShort: "kibit", magnitude: 2 ** 10 },
  { long: "mebibit", short: "Mib", altShort: "Mibit", magnitude: 2 ** 20 },
  { long: "gibibit", short: "Gib", altShort: "Gibit", magnitude: 2 ** 30 },
  { long: "tebibit", short: "Tib", altShort: "Tibit", magnitude: 2 ** 40 },
  { long: "pebibit", short: "Pib", altShort: "Pibit", magnitude: 2 ** 50 },
  { long: "exbibit", short: "Eib", altShort: "Eibit", magnitude: 2 ** 60 },
  { long: "zebibit", short: "Zib", altShort: "Zibit", magnitude: 2 ** 70 },
  { long: "yobibit", short: "Yib", altShort: "Yibit", magnitude: 2 ** 80 },
];

const DECIMAL_BYTE_UNITS: Unit[] = [
  { long: "byte", short: "B", magnitude: 1 },
  { long: "kilobyte", short: "kB", magnitude: 10 ** 3 },
  { long: "megabyte", short: "MB", magnitude: 10 ** 6 },
  { long: "gigabyte", short: "GB", magnitude: 10 ** 9 },
  { long: "terabyte", short: "TB", magnitude: 10 ** 12 },
  { long: "petabyte", short: "PB", magnitude: 10 ** 15 },
  { long: "exabyte", short: "EB", magnitude: 10 ** 18 },
  { long: "zettabyte", short: "ZB", magnitude: 10 ** 21 },
  { long: "yottabyte", short: "YB", magnitude: 10 ** 24 },
];

const DECIMAL_BIT_UNITS: Unit[] = [
  { long: "bit", short: "b", magnitude: 1 },
  { long: "kilobit", short: "kb", altShort: "kbit", magnitude: 10 ** 3 },
  { long: "megabit", short: "Mb", altShort: "Mbit", magnitude: 10 ** 6 },
  { long: "gigabit", short: "Gb", altShort: "Gbit", magnitude: 10 ** 9 },
  { long: "terabit", short: "Tb", altShort: "Tbit", magnitude: 10 ** 12 },
  { long: "petabit", short: "Pb", altShort: "Pbit", magnitude: 10 ** 15 },
  { long: "exabit", short: "Eb", altShort: "Ebit", magnitude: 10 ** 18 },
  { long: "zettabit", short: "Zb", altShort: "Zbit", magnitude: 10 ** 21 },
  { long: "yottabit", short: "Yb", altShort: "Ybit", magnitude: 10 ** 24 },
];
/**
 * Iterates through the `units` map and selects the unit whose `magnitude` is the largest
 * without exceeding the provided `value`.
 * @returns The unit entry with the highest magnitude less than or equal to the input value.
 */
function getUnit(value: number, units: Unit[]): Unit | undefined {
  let unitValue = units[0];
  for (const entry of units) {
    const { magnitude } = entry;
    if (magnitude > value) break;
    unitValue = entry;
  }
  return unitValue;
}

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

  const units = binary
    ? bits ? BINARY_BIT_UNITS : BINARY_BYTE_UNITS
    : bits
    ? DECIMAL_BIT_UNITS
    : DECIMAL_BYTE_UNITS;

  const unit = getUnit(num, units);
  if (!unit) throw new Error(`No unit for number '${num}' found`);
  num /= unit.magnitude;

  const formatOptions = {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  };

  const numberString = toLocaleString(num, locale, formatOptions);

  const name = unit.altShort ?? unit.short;
  return `${prefix}${numberString} ${name}`;
}

type NumberFormatOptions = {
  minimumFractionDigits?: number | undefined;
  maximumFractionDigits?: number | undefined;
};

/**
 * Formats the given number using `Number#toLocaleString`.
 * - If locale is a string, the value is expected to be a locale-key (for example: `de`).
 * - If locale is true, the system default locale is used for translation.
 * - If no value for locale is specified, the number is returned unmodified.
 */
function toLocaleString(
  num: number,
  locale: boolean | string | string[] | undefined,
  options: NumberFormatOptions,
): string {
  // filter out undefined values
  options = Object.fromEntries(
    Object.entries(options).filter(([_, value]) => value !== undefined),
  );

  const hasPrecision = Object.keys(options).length;
  if (!hasPrecision) num = Number(num.toPrecision(3));

  if (typeof locale === "string" || Array.isArray(locale)) {
    return num.toLocaleString(locale, options);
  }
  if (locale === true || hasPrecision) {
    return num.toLocaleString(undefined, options);
  }
  return num.toString();
}
