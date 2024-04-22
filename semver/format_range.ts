// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { format } from "./format.ts";
import type { Comparator, Range } from "./types.ts";

function formatComparator(comparator: Comparator): string {
  const { operator } = comparator;
  return `${operator === undefined ? "" : operator}${format(comparator)}`;
}

/**
 * Formats the range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 */
export function formatRange(range: Range): string {
  return range.map((c) => c.map((c) => formatComparator(c)).join(" "))
    .join("||");
}
