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
 */
export const SATURDAY = 6;
