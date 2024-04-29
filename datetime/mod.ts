// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for dealing with {@linkcode Date} objects.
 *
 * ## Constants
 *
 * Constants such as {@linkcode SECOND}, {@linkcode MINUTE} and {@linkcode HOUR}
 * can be found in the {@linkcode ./constants.ts | constants} module.
 *
 * ## Day of year
 *
 * {@linkcode dayOfYear} returns the number of the day in the year in the local
 * timezone. {@linkcode dayOfYearUtc} does the same but in UTC time.
 *
 * ```ts
 * import { dayOfYear } from "@std/datetime/day-of-year";
 *
 * dayOfYear(new Date("2019-03-11T03:24:00")); // 70
 * ```
 *
 * ## Difference between dates
 *
 * {@linkcode difference} calculates the difference of the 2 given dates in
 * various units.
 *
 * ```ts
 * import { difference } from "@std/datetime/difference";
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
 * //   months: 23,
 * //   quarters: 7,
 * //   years: 1
 * // }
 * ```
 *
 * ## Formatting date strings
 *
 * {@linkcode format} formats a date to a string with the specified format.
 *
 * ```ts
 * import { format } from "@std/datetime/format";
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
 * ## Detecting leap years
 *
 * {@linkcode isLeap} returns whether the given year is a leap year.
 * {@linkcode isUtcLeap} does the same but in UTC time.
 *
 * ```ts
 * import { isLeap } from "@std/datetime/is-leap";
 *
 * isLeap(new Date("1970-01-02")); // false
 *
 * isLeap(1970); // false
 *
 * isLeap(new Date("1972-01-02")); // true
 *
 * isLeap(1972); // true
 * ```
 *
 * ## Parsing date strings
 *
 * {@linkcode parse} parses a date string using the specified format string.
 *
 * ```ts
 * import { parse } from "@std/datetime/parse";
 *
 * parse("20-01-2019", "dd-MM-yyyy"); // 2019-01-19T13:00:00.000Z
 *
 * parse("01-20-2019 04:34 PM", "MM-dd-yyyy hh:mm a"); // 2019-01-20T05:34:00.000Z
 *
 * parse("01-20-2019 16:34:23.123", "MM-dd-yyyy HH:mm:ss.SSS"); // 2019-01-20T05:34:23.123Z
 * ```
 *
 * ## Week of year
 *
 * {@linkcode weekOfYear} returns the number of the week in the year in the local
 * timezone.
 *
 * ```ts
 * import { weekOfYear } from "@std/datetime/week-of-year";
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
