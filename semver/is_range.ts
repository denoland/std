// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range } from "./types.ts";
import { isComparator } from "./is_comparator.ts";

/**
 * Does a deep check on the object to determine if its a valid range.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a valid Range
 * @returns True if its a valid Range otherwise false.
 */
export function isRange(value: unknown): value is Range {
  if (value === null || value === undefined) return false;
  if (!Array.isArray(value)) return false;
  const range = value as Range;
  return range.every((r) =>
    Array.isArray(r) && r.every((c) => isComparator(c))
  );
}
