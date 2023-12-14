// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVerRange } from "./types.ts";
import { stringifyRange } from "./stringify_range.ts";

/**
 * Formats the range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 * @deprecated (will be removed in 0.212.0) Use {@linkcode stringifyRange} instead.
 */
export function rangeFormat(range: SemVerRange) {
  return stringifyRange(range);
}
