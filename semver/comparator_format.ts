// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVerComparator } from "./types.ts";
import { stringifyComparator } from "./stringify_comparator.ts";

/**
 * Formats the comparator into a string
 * @example >=0.0.0
 * @param comparator
 * @returns A string representation of the comparator
 * @deprecated (will be removed in 0.212.0) Use {@linkcode stringifyComparator} instead.
 */
export function comparatorFormat(comparator: SemVerComparator) {
  return stringifyComparator(comparator);
}
