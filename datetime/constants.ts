// Copyright 2018-2025 the Deno authors. MIT license.
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
 * import { JAN } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 1); // 2025-01-01
 * ```
 */
export const JAN = 0;
/**
 * The month index for February.
 *
 * @example
 * ```ts
 * import { FEB } from "@std/datetime/constants";
 *
 * new Date(2025, FEB, 1); // 2025-02-01
 * ```
 */
export const FEB = 1;
/**
 * The month index for March.
 *
 * @example
 * ```ts
 * import { MAR } from "@std/datetime/constants";
 *
 * new Date(2025, MAR, 1); // 2025-03-01
 * ```
 */
export const MAR = 2;
/**
 * The month index for April.
 *
 * @example
 * ```ts
 * import { APR } from "@std/datetime/constants";
 *
 * new Date(2025, APR, 1); // 2025-04-01
 * ```
 */
export const APR = 3;
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
 * import { JUN } from "@std/datetime/constants";
 *
 * new Date(2025, JUN, 1); // 2025-06-01
 * ```
 */
export const JUN = 5;
/**
 * The month index for July.
 *
 * @example
 * ```ts
 * import { JUL } from "@std/datetime/constants";
 *
 * new Date(2025, JUL, 1); // 2025-07-01
 * ```
 */
export const JUL = 6;
/**
 * The month index for August.
 *
 * @example
 * ```ts
 * import { AUG } from "@std/datetime/constants";
 *
 * new Date(2025, AUG, 1); // 2025-08-01
 * ```
 */
export const AUG = 7;
/**
 * The month index for September.
 *
 * @example
 * ```ts
 * import { SEP } from "@std/datetime/constants";
 *
 * new Date(2025, SEP, 1); // 2025-09-01
 * ```
 */
export const SEP = 8;
/**
 * The month index for October.
 *
 * @example
 * ```ts
 * import { OCT } from "@std/datetime/constants";
 *
 * new Date(2025, OCT, 1); // 2025-10-01
 * ```
 */
export const OCT = 9;
/**
 * The month index for November.
 *
 * @example
 * ```ts
 * import { NOV } from "@std/datetime/constants";
 *
 * new Date(2025, NOV, 1); // 2025-11-01
 * ```
 */
export const NOV = 10;
/**
 * The month index for December.
 *
 * @example
 * ```ts
 * import { DEC } from "@std/datetime/constants";
 *
 * new Date(2025, DEC, 1); // 2025-12-01
 * ```
 */
export const DEC = 11;
/**
 * The day of week index for Sunday.
 *
 * @example
 * ```ts
 * import { JAN, SUN } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 5).getDay() === SUN; // true
 * ```
 */
export const SUN = 0;
/**
 * The day of week index for Monday.
 *
 * @example
 * ```ts
 * import { JAN, MON } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 6).getDay() === MON; // true
 * ```
 */
export const MON = 1;
/**
 * The day of week index for Tuesday.
 *
 * @example
 * ```ts
 * import { JAN, TUE } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 7).getDay() === TUE; // true
 * ```
 */
export const TUE = 2;
/**
 * The day of week index for Wednesday.
 *
 * @example
 * ```ts
 * import { JAN, WED } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 1).getDay() === WED; // true
 * ```
 */
export const WED = 3;
/**
 * The day of week index for Thursday.
 *
 * @example
 * ```ts
 * import { JAN, THU } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 2).getDay() === THU; // true
 * ```
 */
export const THU = 4;
/**
 * The day of week index for Friday.
 *
 * @example
 * ```ts
 * import { JAN, FRI } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 3).getDay() === FRI; // true
 * ```
 */
export const FRI = 5;
/**
 * The day of week index for Saturday.
 *
 * @example
 * ```ts
 * import { JAN, SAT } from "@std/datetime/constants";
 *
 * new Date(2025, JAN, 4).getDay() === SAT; // true
 * ```
 */
export const SAT = 6;
