// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVerRange } from "./types.ts";
import { isComparator } from "./_is_comparator.ts";

/**
 * Does a deep check on the object to determine if its a valid range.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a valid SemVerRange
 * @returns True if its a valid SemVerRange otherwise false.
 *
 * @deprecated (will be removed in 0.216.0) Use {@linkcode isRange} instead.
 */
export function isSemVerRange(value: unknown): value is SemVerRange {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return false;
  if (typeof value !== "object") return false;
  const { ranges } = value as SemVerRange;
  return (
    Array.isArray(ranges) &&
    ranges.every((r) => Array.isArray(r) && r.every((c) => isComparator(c)))
  );
}
