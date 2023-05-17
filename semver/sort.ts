// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./semver.ts";
import { compare } from "./compare.ts";

/** Sorts a list of semantic versions in ascending order. */
export function sort(
  list: SemVer[],
): SemVer[];
/** @deprecated (will be removed after 0.189.0) Use `sort(list: SemVer[])` instead. */
export function sort(
  list: (string | SemVer)[],
  options?: { includePrerelease: boolean },
): (SemVer | string)[];
export function sort(
  list: (string | SemVer)[],
  options?: { includePrerelease: boolean },
): (SemVer | string)[] {
  return list.sort((a, b) => compare(a, b, options));
}

/** Sorts a list of semantic versions in descending order. */
export function rsort(
  list: SemVer[],
): SemVer[];
/** @deprecated (will be removed after 0.189.0) Use `sort(list: SemVer[])` instead. */
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
