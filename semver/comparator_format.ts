import type { SemVerComparator } from "./types.ts";
import { format } from "./format.ts";

/**
 * Formats the comparator into a string
 * @example >=0.0.0
 * @param comparator
 * @returns A string representation of the comparator
 */
export function comparatorFormat(comparator: SemVerComparator) {
  const { semver, operator } = comparator;
  return `${operator}${format(semver)}`;
}
