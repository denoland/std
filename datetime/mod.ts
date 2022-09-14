// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for dealing with {@linkcode Date} objects.
 *
 * The following symbols from
 * [unicode LDML](http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)
 * are supported:
 *
 * - `yyyy` - numeric year.
 * - `yy` - 2-digit year.
 * - `M` - numeric month.
 * - `MM` - 2-digit month.
 * - `d` - numeric day.
 * - `dd` - 2-digit day.
 *
 * - `H` - numeric hour (0-23 hours).
 * - `HH` - 2-digit hour (00-23 hours).
 * - `h` - numeric hour (1-12 hours).
 * - `hh` - 2-digit hour (01-12 hours).
 * - `m` - numeric minute.
 * - `mm` - 2-digit minute.
 * - `s` - numeric second.
 * - `ss` - 2-digit second.
 * - `S` - 1-digit fractionalSecond.
 * - `SS` - 2-digit fractionalSecond.
 * - `SSS` - 3-digit fractionalSecond.
 *
 * - `a` - dayPeriod, either `AM` or `PM`.
 *
 * - `'foo'` - quoted literal.
 * - `./-` - unquoted literal.
 *
 * This module is browser compatible.
 *
 * @module
 */

import { DateTimeFormatter } from "./formatter.ts";

/**
 * The number of milliseconds in a second.
 *
 * @example
 * ```ts
 * import { SECOND } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * console.log(SECOND); // => 1000
 * ```
 */
export const SECOND = 1e3;
/**
 * The number of milliseconds in a minute.
 *
 * @example
 * ```ts
 * import { MINUTE } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * console.log(MINUTE); // => 60000 (60 * 1000)
 * ```
 */
export const MINUTE = SECOND * 60;
/**
 * The number of milliseconds in an hour.
 *
 * @example
 * ```ts
 * import { HOUR } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * console.log(HOUR); // => 3600000 (60 * 60 * 1000)
 * ```
 */
export const HOUR = MINUTE * 60;
/**
 * The number of milliseconds in a day.
 *
 * @example
 * ```ts
 * import { DAY } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * console.log(DAY); // => 86400000 (24 * 60 * 60 * 1000)
 * ```
 */
export const DAY = HOUR * 24;
/**
 * The number of milliseconds in a week.
 *
 * @example
 * ```ts
 * import { WEEK } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * console.log(WEEK); // => 604800000 (7 * 24 * 60 * 60 * 1000)
 * ```
 */
export const WEEK = DAY * 7;
const DAYS_PER_WEEK = 7;

enum Day {
  Sun,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat,
}

/**
 * Takes an input `string` and a `formatString` to parse to a `date`.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * parse("20-01-2019", "dd-MM-yyyy"); // output : new Date(2019, 0, 20)
 * parse("2019-01-20", "yyyy-MM-dd"); // output : new Date(2019, 0, 20)
 * parse("20.01.2019", "dd.MM.yyyy"); // output : new Date(2019, 0, 20)
 * parse("01-20-2019 16:34", "MM-dd-yyyy HH:mm"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("01-20-2019 04:34 PM", "MM-dd-yyyy hh:mm a"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("16:34 01-20-2019", "HH:mm MM-dd-yyyy"); // output : new Date(2019, 0, 20, 16, 34)
 * parse("01-20-2019 16:34:23.123", "MM-dd-yyyy HH:mm:ss.SSS"); // output : new Date(2019, 0, 20, 16, 34, 23, 123)
 * ```
 *
 * @param dateString Date string
 * @param formatString Format string
 * @return Parsed date
 */
export function parse(dateString: string, formatString: string): Date {
  const formatter = new DateTimeFormatter(formatString);
  const parts = formatter.parseToParts(dateString);
  const sortParts = formatter.sortDateTimeFormatPart(parts);
  return formatter.partsToDate(sortParts);
}

/**
 * Takes an input `date` and a `formatString` to format to a `string`.
 *
 * @example
 * ```ts
 * import { format } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * format(new Date(2019, 0, 20), "dd-MM-yyyy"); // output : "20-01-2019"
 * format(new Date(2019, 0, 20), "yyyy-MM-dd"); // output : "2019-01-20"
 * format(new Date(2019, 0, 20), "dd.MM.yyyy"); // output : "20.01.2019"
 * format(new Date(2019, 0, 20, 16, 34), "MM-dd-yyyy HH:mm"); // output : "01-20-2019 16:34"
 * format(new Date(2019, 0, 20, 16, 34), "MM-dd-yyyy hh:mm a"); // output : "01-20-2019 04:34 PM"
 * format(new Date(2019, 0, 20, 16, 34), "HH:mm MM-dd-yyyy"); // output : "16:34 01-20-2019"
 * format(new Date(2019, 0, 20, 16, 34, 23, 123), "MM-dd-yyyy HH:mm:ss.SSS"); // output : "01-20-2019 16:34:23.123"
 * format(new Date(2019, 0, 20), "'today:' yyyy-MM-dd"); // output : "today: 2019-01-20"
 * ```
 *
 * @param date Date
 * @param formatString Format string
 * @return formatted date string
 */
export function format(date: Date, formatString: string): string {
  const formatter = new DateTimeFormatter(formatString);
  return formatter.format(date);
}

/**
 * Returns the number of the day in the year.
 *
 * @example
 * ```ts
 * import { dayOfYear } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * dayOfYear(new Date("2019-03-11T03:24:00")); // output: 70
 * ```
 *
 * @return Number of the day in year
 */
export function dayOfYear(date: Date): number {
  // Values from 0 to 99 map to the years 1900 to 1999. All other values are the actual year. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)
  // Using setFullYear as a workaround

  const yearStart = new Date(date);

  yearStart.setUTCFullYear(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() -
    yearStart.getTime();

  return Math.floor(diff / DAY);
}
/**
 * Returns the ISO week number of the provided date (1-53).
 *
 * @example
 * ```ts
 * import { weekOfYear } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * weekOfYear(new Date("2020-12-28T03:24:00")); // Returns 53
 * ```
 *
 * @return Number of the week in year
 */
export function weekOfYear(date: Date): number {
  const workingDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );

  const day = workingDate.getUTCDay();

  const nearestThursday = workingDate.getUTCDate() +
    Day.Thu -
    (day === Day.Sun ? DAYS_PER_WEEK : day);

  workingDate.setUTCDate(nearestThursday);

  // Get first day of year
  const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));

  // return the calculated full weeks to nearest Thursday
  return Math.ceil((workingDate.getTime() - yearStart.getTime() + DAY) / WEEK);
}

/**
 * Formats the given date to IMF date time format. (Reference:
 * https://tools.ietf.org/html/rfc7231#section-7.1.1.1).
 * IMF is the time format to use when generating times in HTTP
 * headers. The time being formatted must be in UTC for Format to
 * generate the correct format.
 *
 * @example
 * ```ts
 * import { toIMF } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * toIMF(new Date(0)); // => returns "Thu, 01 Jan 1970 00:00:00 GMT"
 * ```
 * @param date Date to parse
 * @return IMF date formatted string
 */
export function toIMF(date: Date): string {
  function dtPad(v: string, lPad = 2): string {
    return v.padStart(lPad, "0");
  }
  const d = dtPad(date.getUTCDate().toString());
  const h = dtPad(date.getUTCHours().toString());
  const min = dtPad(date.getUTCMinutes().toString());
  const s = dtPad(date.getUTCSeconds().toString());
  const y = date.getUTCFullYear();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[date.getUTCDay()]}, ${d} ${
    months[date.getUTCMonth()]
  } ${y} ${h}:${min}:${s} GMT`;
}

/**
 * Returns whether the given date or year (in number) is a leap year or not.
 * based on: https://docs.microsoft.com/en-us/office/troubleshoot/excel/determine-a-leap-year
 *
 * @example
 * ```ts
 * import { isLeap } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * isLeap(new Date("1970-01-01")); // => returns false
 * isLeap(new Date("1972-01-01")); // => returns true
 * isLeap(new Date("2000-01-01")); // => returns true
 * isLeap(new Date("2100-01-01")); // => returns false
 * isLeap(1972); // => returns true
 * ```
 *
 * @param year year in number or Date format
 */
export function isLeap(year: Date | number): boolean {
  const yearNumber = year instanceof Date ? year.getFullYear() : year;
  return (
    (yearNumber % 4 === 0 && yearNumber % 100 !== 0) || yearNumber % 400 === 0
  );
}

export type Unit =
  | "milliseconds"
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "quarters"
  | "years";

export type DifferenceFormat = Partial<Record<Unit, number>>;

export type DifferenceOptions = {
  units?: Unit[];
};

/**
 * Returns the difference of the 2 given dates in the given units. If the units
 * are omitted, it returns the difference in the all available units.
 *
 * @example
 * ```ts
 * import { difference } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * const date0 = new Date("2018-05-14");
 * const date1 = new Date("2020-05-13");
 *
 * difference(date0, date1, { units: ["days", "months", "years"] });
 * // => returns { days: 730, months: 23, years: 1 }
 *
 * difference(date0, date1);
 * // => returns {
 * //   milliseconds: 63072000000,
 * //   seconds: 63072000,
 * //   minutes: 1051200,
 * //   hours: 17520,
 * //   days: 730,
 * //   weeks: 104,
 * //   months: 23,
 * //   quarters: 5,
 * //   years: 1
 * // }
 * ```
 *
 * @param from Year to calculate difference
 * @param to Year to calculate difference with
 * @param options Options for determining how to respond
 */
export function difference(
  from: Date,
  to: Date,
  options?: DifferenceOptions,
): DifferenceFormat {
  const uniqueUnits = options?.units ? [...new Set(options?.units)] : [
    "milliseconds",
    "seconds",
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "quarters",
    "years",
  ];

  const bigger = Math.max(from.getTime(), to.getTime());
  const smaller = Math.min(from.getTime(), to.getTime());
  const differenceInMs = bigger - smaller;

  const differences: DifferenceFormat = {};

  for (const uniqueUnit of uniqueUnits) {
    switch (uniqueUnit) {
      case "milliseconds":
        differences.milliseconds = differenceInMs;
        break;
      case "seconds":
        differences.seconds = Math.floor(differenceInMs / SECOND);
        break;
      case "minutes":
        differences.minutes = Math.floor(differenceInMs / MINUTE);
        break;
      case "hours":
        differences.hours = Math.floor(differenceInMs / HOUR);
        break;
      case "days":
        differences.days = Math.floor(differenceInMs / DAY);
        break;
      case "weeks":
        differences.weeks = Math.floor(differenceInMs / WEEK);
        break;
      case "months":
        differences.months = calculateMonthsDifference(bigger, smaller);
        break;
      case "quarters":
        differences.quarters = Math.floor(
          (typeof differences.months !== "undefined" &&
            differences.months / 4) ||
            calculateMonthsDifference(bigger, smaller) / 4,
        );
        break;
      case "years":
        differences.years = Math.floor(
          (typeof differences.months !== "undefined" &&
            differences.months / 12) ||
            calculateMonthsDifference(bigger, smaller) / 12,
        );
        break;
    }
  }

  return differences;
}

function calculateMonthsDifference(bigger: number, smaller: number): number {
  const biggerDate = new Date(bigger);
  const smallerDate = new Date(smaller);
  const yearsDiff = biggerDate.getFullYear() - smallerDate.getFullYear();
  const monthsDiff = biggerDate.getMonth() - smallerDate.getMonth();
  const calendarDifferences = Math.abs(yearsDiff * 12 + monthsDiff);
  const compareResult = biggerDate > smallerDate ? 1 : -1;
  biggerDate.setMonth(
    biggerDate.getMonth() - compareResult * calendarDifferences,
  );
  const isLastMonthNotFull = biggerDate > smallerDate
    ? 1
    : -1 === -compareResult
    ? 1
    : 0;
  const months = compareResult * (calendarDifferences - isLastMonthNotFull);
  return months === 0 ? 0 : months;
}
