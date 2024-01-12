// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVerRange } from "./types.ts";
import { formatComparator } from "./_comparator.ts";

/**
 * Formats the range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 */
export function formatRange(range: SemVerRange): string {
  return range.ranges.map((c) => c.map((c) => formatComparator(c)).join(" "))
    .join("||");
}
