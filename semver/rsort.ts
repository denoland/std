// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/** Sorts a list of semantic versions in descending order. */
export function rsort(
  list: SemVer[],
): SemVer[];
/** @deprecated (will be removed after 0.200.0) Use `sort(list: SemVer[])` instead. */
export function rsort(
  list: (string | SemVer)[],
  options?: { includePrerelease: boolean },
): (SemVer | string)[];
export function rsort(
  list: (string | SemVer)[],
  options?: { includePrerelease: boolean },
): (SemVer | string)[] {
  return list.sort((a, b) => compare(b, a, options));
}
