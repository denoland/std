// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { isComparator } from "./is_comparator.ts";

/**
 * Does a deep check on the value to see if it is a valid SemVerComparator object.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a SemVerComparator
 * @returns True if the object is a SemVerComparator otherwise false
 * @deprecated (will be removed in 0.212.0) Use {@linkcode isComparator} instead.
 */
export const isSemVerComparator: typeof isComparator = isComparator;
