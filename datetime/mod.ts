// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for dealing with {@linkcode Date} objects.
 *
 * ```ts
 * import {
 *   dayOfYear,
 *   format,
 *   isLeap,
 * } from "https://deno.land/std@$STD_VERSION/datetime/mod.ts";
 *
 * const date = new Date("2020-07-10T03:24:00");
 *
 * dayOfYear(date); // 192
 *
 * format(date, "dd-MM-yyyy"); // "10-07-2020"
 *
 * isLeap(date); // true
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
