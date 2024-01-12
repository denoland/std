// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Comparator } from "./types.ts";
import * as c from "./_comparator.ts";
/**
 * Does a deep check on the value to see if it is a valid Comparator object.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a Comparator
 * @returns True if the object is a Comparator otherwise false
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode isSemVerRange} instead.
 */
export function isComparator(value: unknown): value is Comparator {
  return c.isComparator(value);
}
