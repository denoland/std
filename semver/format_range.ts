// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVerRange } from "./types.ts";
import { comparatorFormat } from "./_comparator_format.ts";

/**
 * Formats the range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 */
export function formatRange(range: SemVerRange | Range): string {
  return (Array.isArray(range) ? range : range.ranges).map((c) =>
    c.map((c) => comparatorFormat(c)).join(" ")
  )
    .join("||");
}
