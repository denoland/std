// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Format milliseconds to time duration.
 *
 * ```ts
 * import { format } from "@std/fmt/duration";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(99674, { style: "digital" }), "00:00:01:39:674:000:000");
 *
 * assertEquals(format(99674), "0d 0h 1m 39s 674ms 0µs 0ns");
 *
 * assertEquals(format(99674, { ignoreZero: true }), "1m 39s 674ms");
 *
 * assertEquals(format(99674, { style: "full", ignoreZero: true }), "1 minutes, 39 seconds, 674 milliseconds");
 * ```
 * @module
 */

function addZero(num: number, digits: number) {
  return String(num).padStart(digits, "0");
}

type DurationPartType =
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds"
  | "microseconds"
  | "nanoseconds";

const NARROW_DURATION_NAME_MAP = new Map<DurationPartType, string>([
  ["days", "d"],
  ["hours", "h"],
  ["minutes", "m"],
  ["seconds", "s"],
  ["milliseconds", "ms"],
  ["microseconds", "µs"],
  ["nanoseconds", "ns"],
]);
const FULL_EN_DURATION_NAME_MAP = new Map<DurationPartType, string>([
  ["days", "days"],
  ["hours", "hours"],
  ["minutes", "minutes"],
  ["seconds", "seconds"],
  ["milliseconds", "milliseconds"],
  ["microseconds", "microseconds"],
  ["nanoseconds", "nanoseconds"],
]);

/** Parse milliseconds into a duration parts. */
function millisecondsToDurationParts(
  ms: number,
): { type: DurationPartType; value: number }[] {
  // Duration cannot be negative
  const millis = Math.abs(ms);
  const millisFraction = millis.toFixed(7).slice(-7, -1);
  return [
    { type: "days", value: Math.trunc(millis / 86400000) },
    { type: "hours", value: Math.trunc(millis / 3600000) % 24 },
    { type: "minutes", value: Math.trunc(millis / 60000) % 60 },
    { type: "seconds", value: Math.trunc(millis / 1000) % 60 },
    { type: "milliseconds", value: Math.trunc(millis) % 1000 },
    { type: "microseconds", value: +millisFraction.slice(0, 3) },
    { type: "nanoseconds", value: +millisFraction.slice(3, 6) },
  ];
}

/** Options for {@linkcode format}. */
export interface FormatOptions {
  /**
   * The style for formatting the duration.
   *
   * "narrow" for "0d 0h 0m 0s 0ms..."
   * "digital" for "00:00:00:00:000..."
   * "full" for "0 days, 0 hours, 0 minutes,..."
   *
   * @default {"narrow"}
   */
  style?: "narrow" | "digital" | "full";
  /**
   * Whether to ignore zero values.
   * With style="narrow" | "full", all zero values are ignored.
   * With style="digital", only values in the ends are ignored.
   *
   * @default {false}
   */
  ignoreZero?: boolean;
}

/**
 * Format milliseconds to time duration.
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/fmt/duration";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format(99674, { style: "digital" }), "00:00:01:39:674:000:000");
 *
 * assertEquals(format(99674), "0d 0h 1m 39s 674ms 0µs 0ns");
 *
 * assertEquals(format(99674, { ignoreZero: true }), "1m 39s 674ms");
 *
 * assertEquals(format(99674, { style: "full", ignoreZero: true }), "1 minutes, 39 seconds, 674 milliseconds");
 * ```
 *
 * @param ms The milliseconds value to format
 * @param options The options for formatting
 * @returns The formatted string
 */
export function format(
  ms: number,
  options?: FormatOptions,
): string {
  const {
    style = "narrow",
    ignoreZero = false,
  } = options ?? {};

  const parts = millisecondsToDurationParts(ms);

  switch (style) {
    case "narrow": {
      const arr = ignoreZero ? parts.filter((x) => x.value) : parts;
      return arr
        .map((x) => `${x.value}${NARROW_DURATION_NAME_MAP.get(x.type)}`)
        .join(" ");
    }
    case "full": {
      const arr = ignoreZero ? parts.filter((x) => x.value) : parts;
      return arr
        .map((x) => `${x.value} ${FULL_EN_DURATION_NAME_MAP.get(x.type)}`)
        .join(", ");
    }
    case "digital": {
      const arr = parts.map((x) =>
        ["milliseconds", "microseconds", "nanoseconds"].includes(x.type)
          ? addZero(x.value, 3)
          : addZero(x.value, 2)
      );
      if (ignoreZero) {
        let cont = true;
        while (cont) {
          if (!Number(arr[arr.length - 1])) arr.pop();
          else cont = false;
        }
      }
      return arr.join(":");
    }
    default: {
      throw new TypeError(`style must be "narrow", "full", or "digital"!`);
    }
  }
}
