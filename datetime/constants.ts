// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * The number of milliseconds in a second.
 *
 * @example
 * ```ts
 * import { SECOND } from "@std/datetime/constants";
 *
 * SECOND; // 1_000
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { SECOND } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(30 * SECOND, 30_000);
 *
 * // After
 * assertEquals(Temporal.Duration.from({ seconds: 30 }).total("milliseconds"), 30_000);
 * ```
 *
 * @deprecated Use {@linkcode Temporal.Duration} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const SECOND = 1e3;
/**
 * The number of milliseconds in a minute.
 *
 * @example
 * ```ts
 * import { MINUTE } from "@std/datetime/constants";
 *
 * MINUTE; // 60_000
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { MINUTE } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(5 * MINUTE, 300_000);
 *
 * // After
 * assertEquals(Temporal.Duration.from({ minutes: 5 }).total("milliseconds"), 300_000);
 * ```
 *
 * @deprecated Use {@linkcode Temporal.Duration} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const MINUTE: number = SECOND * 60;
/**
 * The number of milliseconds in an hour.
 *
 * @example
 * ```ts
 * import { HOUR } from "@std/datetime/constants";
 *
 * HOUR; // 3_600_000
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { HOUR } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(2 * HOUR, 7_200_000);
 *
 * // After
 * assertEquals(Temporal.Duration.from({ hours: 2 }).total("milliseconds"), 7_200_000);
 * ```
 *
 * @deprecated Use {@linkcode Temporal.Duration} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const HOUR: number = MINUTE * 60;
/**
 * The number of milliseconds in a day.
 *
 * @example
 * ```ts
 * import { DAY } from "@std/datetime/constants";
 *
 * DAY; // 86_400_000
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { DAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(3 * DAY, 259_200_000);
 *
 * // After
 * assertEquals(Temporal.Duration.from({ days: 3 }).total("milliseconds"), 259_200_000);
 * ```
 *
 * @deprecated Use {@linkcode Temporal.Duration} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const DAY: number = HOUR * 24;
/**
 * The number of milliseconds in a week.
 *
 * @example
 * ```ts
 * import { WEEK } from "@std/datetime/constants";
 *
 * WEEK; // 604_800_000
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { WEEK } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(2 * WEEK, 1_209_600_000);
 *
 * // After
 * assertEquals(
 *   Temporal.Duration.from({ weeks: 2 })
 *     .total({ unit: "milliseconds", relativeTo: "2025-01-01" }),
 *   1_209_600_000,
 * );
 * ```
 *
 * @deprecated Use {@linkcode Temporal.Duration} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const WEEK: number = DAY * 7;
/**
 * The month index for January.
 *
 * @example
 * ```ts
 * import { JANUARY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 1); // 2025-01-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { JANUARY } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, JANUARY, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 1, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `1` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const JANUARY = 0;
/**
 * The month index for February.
 *
 * @example
 * ```ts
 * import { FEBRUARY } from "@std/datetime/constants";
 *
 * new Date(2025, FEBRUARY, 1); // 2025-02-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { FEBRUARY } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, FEBRUARY, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 2, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `2` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const FEBRUARY = 1;
/**
 * The month index for March.
 *
 * @example
 * ```ts
 * import { MARCH } from "@std/datetime/constants";
 *
 * new Date(2025, MARCH, 1); // 2025-03-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { MARCH } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, MARCH, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 3, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `3` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const MARCH = 2;
/**
 * The month index for April.
 *
 * @example
 * ```ts
 * import { APRIL } from "@std/datetime/constants";
 *
 * new Date(2025, APRIL, 1); // 2025-04-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { APRIL } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, APRIL, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 4, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `4` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const APRIL = 3;
/**
 * The month index for May.
 *
 * @example
 * ```ts
 * import { MAY } from "@std/datetime/constants";
 *
 * new Date(2025, MAY, 1); // 2025-05-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { MAY } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, MAY, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 5, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `5` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const MAY = 4;
/**
 * The month index for June.
 *
 * @example
 * ```ts
 * import { JUNE } from "@std/datetime/constants";
 *
 * new Date(2025, JUNE, 1); // 2025-06-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { JUNE } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, JUNE, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 6, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `6` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const JUNE = 5;
/**
 * The month index for July.
 *
 * @example
 * ```ts
 * import { JULY } from "@std/datetime/constants";
 *
 * new Date(2025, JULY, 1); // 2025-07-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { JULY } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, JULY, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 7, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `7` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const JULY = 6;
/**
 * The month index for August.
 *
 * @example
 * ```ts
 * import { AUGUST } from "@std/datetime/constants";
 *
 * new Date(2025, AUGUST, 1); // 2025-08-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { AUGUST } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, AUGUST, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 8, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `8` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const AUGUST = 7;
/**
 * The month index for September.
 *
 * @example
 * ```ts
 * import { SEPTEMBER } from "@std/datetime/constants";
 *
 * new Date(2025, SEPTEMBER, 1); // 2025-09-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { SEPTEMBER } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, SEPTEMBER, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 9, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `9` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const SEPTEMBER = 8;
/**
 * The month index for October.
 *
 * @example
 * ```ts
 * import { OCTOBER } from "@std/datetime/constants";
 *
 * new Date(2025, OCTOBER, 1); // 2025-10-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { OCTOBER } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, OCTOBER, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 10, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `10` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const OCTOBER = 9;
/**
 * The month index for November.
 *
 * @example
 * ```ts
 * import { NOVEMBER } from "@std/datetime/constants";
 *
 * new Date(2025, NOVEMBER, 1); // 2025-11-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { NOVEMBER } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, NOVEMBER, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 11, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `11` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const NOVEMBER = 10;
/**
 * The month index for December.
 *
 * @example
 * ```ts
 * import { DECEMBER } from "@std/datetime/constants";
 *
 * new Date(2025, DECEMBER, 1); // 2025-12-01
 * ```
 *
 * @example Migration to Temporal
 * ```ts no-assert
 * import { DECEMBER } from "@std/datetime/constants";
 *
 * // Before
 * new Date(2025, DECEMBER, 1);
 *
 * // After (Temporal months are 1-based)
 * Temporal.PlainDate.from({ year: 2025, month: 12, day: 1 });
 * ```
 *
 * @deprecated Use the 1-based month number `12` with
 * {@linkcode Temporal.PlainDate} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const DECEMBER = 11;
/**
 * The day of week index for Sunday.
 *
 * @example
 * ```ts
 * import { JANUARY, SUNDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 5).getDay() === SUNDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { SUNDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-05T00:00").getDay(), SUNDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-05").dayOfWeek, 7);
 * ```
 *
 * @deprecated Use the day-of-week number `7` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const SUNDAY = 0;
/**
 * The day of week index for Monday.
 *
 * @example
 * ```ts
 * import { JANUARY, MONDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 6).getDay() === MONDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { MONDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-06T00:00").getDay(), MONDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-06").dayOfWeek, 1);
 * ```
 *
 * @deprecated Use the day-of-week number `1` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const MONDAY = 1;
/**
 * The day of week index for Tuesday.
 *
 * @example
 * ```ts
 * import { JANUARY, TUESDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 7).getDay() === TUESDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { TUESDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-07T00:00").getDay(), TUESDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-07").dayOfWeek, 2);
 * ```
 *
 * @deprecated Use the day-of-week number `2` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const TUESDAY = 2;
/**
 * The day of week index for Wednesday.
 *
 * @example
 * ```ts
 * import { JANUARY, WEDNESDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 1).getDay() === WEDNESDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { WEDNESDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-01T00:00").getDay(), WEDNESDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-01").dayOfWeek, 3);
 * ```
 *
 * @deprecated Use the day-of-week number `3` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const WEDNESDAY = 3;
/**
 * The day of week index for Thursday.
 *
 * @example
 * ```ts
 * import { JANUARY, THURSDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 2).getDay() === THURSDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { THURSDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-02T00:00").getDay(), THURSDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-02").dayOfWeek, 4);
 * ```
 *
 * @deprecated Use the day-of-week number `4` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const THURSDAY = 4;
/**
 * The day of week index for Friday.
 *
 * @example
 * ```ts
 * import { JANUARY, FRIDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 3).getDay() === FRIDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { FRIDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-03T00:00").getDay(), FRIDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-03").dayOfWeek, 5);
 * ```
 *
 * @deprecated Use the day-of-week number `5` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const FRIDAY = 5;
/**
 * The day of week index for Saturday.
 *
 * @example
 * ```ts
 * import { JANUARY, SATURDAY } from "@std/datetime/constants";
 *
 * new Date(2025, JANUARY, 4).getDay() === SATURDAY; // true
 * ```
 *
 * @example Migration to Temporal
 * ```ts
 * import { SATURDAY } from "@std/datetime/constants";
 * import { assertEquals } from "@std/assert";
 *
 * // Before
 * assertEquals(new Date("2025-01-04T00:00").getDay(), SATURDAY);
 *
 * // After (ISO 8601: Monday is 1, Sunday is 7)
 * assertEquals(Temporal.PlainDate.from("2025-01-04").dayOfWeek, 6);
 * ```
 *
 * @deprecated Use the day-of-week number `6` with
 * {@linkcode Temporal.PlainDate.prototype.dayOfWeek} instead. See
 * https://github.com/denoland/std/issues/7262 for details.
 */
export const SATURDAY = 6;
