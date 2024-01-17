// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { formatRange } from "./format_range.ts";
import { Range, SemVerRange } from "./types.ts";

/**
 * Formats the range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 *
 * @deprecated (will be removed after 0.213.0) Use {@linkcode formatRange} instead.
 */
export function rangeFormat(range: SemVerRange | Range): string {
  return formatRange(range);
}
