// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "../semver.ts";
import { compare } from "./compare.ts";

/**
 * Semantically sorts a list of semantic versions in ascending order.
 * @param list The list to sort
 * @returns The results of the sort operation
 */
export function sort(
  list: SemVer[],
): SemVer[] {
  return list.sort((a, b) => compare(a, b));
}

/**
 * Semantically sorts a list of semantic versions in descending order.
 * @param list The list to sort
 * @returns The results of the sort operation
 */
export function rsort(
  list: SemVer[],
): SemVer[] {
  return list.sort((a, b) => compare(b, a));
}
