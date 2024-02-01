// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * Sorts a list of semantic versions in ascending order.
 *
 * @deprecated (will be removed in 0.215.0) Use `list.sort(compare)` with {@linkcode compare} instead.
 */
export function sort(
  list: SemVer[],
): SemVer[] {
  return list.sort((a, b) => compare(a, b));
}
