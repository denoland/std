// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVerRange } from "./types.ts";
import { isRange } from "./is_range.ts";

/**
 * Does a deep check on the object to determine if its a valid range.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a valid SemVerRange
 * @returns True if its a valid SemVerRange otherwise false.
 * @deprecated (will be removed in 0.211.0) use `Range` instead.
 */
export function isSemVerRange(value: unknown): value is SemVerRange {
  return isRange(value);
}
