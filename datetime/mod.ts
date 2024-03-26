// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for dealing with {@linkcode Date} objects.
 *
 * ## Day of the year
 *
 * {@linkcode dayOfYear} returns the number of the day in the year in the local
 * time zone.
 *
 * ```ts
 * import { dayOfYear } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * dayOfYear(new Date("2019-03-11T03:24:00")); // 70
 * ```
 *
 * Similarly, {@linkcode dayOfYearUtc} returns the number of the day in the year
 * in UTC time.
 *
 * ```ts
 * import { dayOfYearUtc } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * dayOfYearUtc(new Date("2019-03-11T03:24:00.000Z")) // 70
 * ```
 *
 * ## Difference between dates
 *
 * {@linkcode difference} returns the difference between two dates.
 *
 * ```ts
 * import { difference } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * const date0 = new Date("2018-05-14");
 * const date1 = new Date("2020-05-13");
 *
 * difference(date0, date1);
 * // {
 * //   milliseconds: 63072000000,
 * //   seconds: 63072000,
 * //   minutes: 1051200,
 * //   hours: 17520,
 * //   days: 730,
 * //   weeks: 104,
 * //   months: 24,
 * //   quarters: 8,
 * //   years: 2
 * // }
 * ```
 *
 * ## Formatting dates
 *
 * {@linkcode format} formats a date to a string with the specified format.
 *
 * ```ts
 * import { format } from "https://deno.land/std@$STD_VERSION/datetime/format.ts";
 *
 * const date = new Date(2019, 0, 20, 16, 34, 23, 123);
 *
 * format(date, "dd-MM-yyyy"); // "20-01-2019"
 *
 * format(date, "MM-dd-yyyy HH:mm:ss.SSS"); // "01-20-2019 16:34:23.123"
 *
 * format(date, "'today:' yyyy-MM-dd"); // "today: 2019-01-20"
 * ```
 *
 * ## Leap year
 *
 * {@linkcode isLeap} returns whether the given date or year (in number) is a leap year or not.
 *
 * ```ts
 * import { isLeap } from "https://deno.land/std@$STD_VERSION/datetime/is_leap.ts";
 *
 * isLeap(new Date("1970-01-02")); // false
 *
 * isLeap(new Date("1972-01-02")); // true
 * ```
 *
 * Similarly, {@linkcode isUtcLeap} returns whether the given year is a leap year in UTC time.
 *
 * ```ts
 * import { isUtcLeap } from "https://deno.land/std@$STD_VERSION/datetime/is_leap.ts";
 *
 * isUtcLeap(new Date("2000-01-01")); // true
 *
 * isUtcLeap(new Date("December 31, 1999 23:59:59 GMT-01:00")); // true
 * ```
 *
 * ## Parsing dates
 *
 * {@linkcode parse} parses a date string using the specified format string.
 *
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/datetime/parse.ts";
 *
 * parse("20-01-2019", "dd-MM-yyyy"); // 2019-01-19T13:00:00.000Z
 *
 * parse("01-20-2019 04:34 PM", "MM-dd-yyyy hh:mm a"); // 2019-01-20T05:34:00.000Z
 *
 * parse("01-20-2019 16:34:23.123", "MM-dd-yyyy HH:mm:ss.SSS"); // 2019-01-20T05:34:23.123Z
 * ```
 *
 * ## Week of the year
 *
 * {@linkcode weekOfYear} returns the number of the week in the year in the local time zone.
 *
 * ```ts
 * import { weekOfYear } from "https://deno.land/std@$STD_VERSION/datetime/week_of_year.ts";
 *
 * weekOfYear(new Date("2020-12-28T03:24:00")); // 53
 *
 * weekOfYear(new Date("2020-07-10T03:24:00")); // 28
 * ```
 *
 * @module
 */
export * from "./constants.ts";
export * from "./day_of_year.ts";
export * from "./difference.ts";
export * from "./format.ts";
export * from "./is_leap.ts";
export * from "./parse.ts";
export * from "./week_of_year.ts";
