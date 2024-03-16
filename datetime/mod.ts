// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for dealing with {@linkcode Date} objects.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import { difference } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * const date0 = new Date("2018-05-14");
 * const date1 = new Date("2020-05-13");
 *
 * const result = difference(date0, date1, { units: ["days", "months", "years"] });
 * result.days; // 730
 * result.months; // 23
 * result.years; // 1
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
