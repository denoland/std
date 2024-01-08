// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator } from "./types.ts";
import { format } from "./format.ts";

/**
 * Formats the comparator into a string
 * @example >=0.0.0
 * @param comparator
 * @returns A string representation of the comparator
 *
 * @deprecated (will be removed in 0.213.0) Use {@linkcode formatRange} instead.
 */
export function comparatorFormat(comparator: Comparator): string {
  const { semver, operator } = comparator;
  return `${operator}${format(semver)}`;
}
