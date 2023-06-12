// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer, SemVerRange } from "./types.ts";
import { sort } from "./sort.ts";
import { testRange } from "./test_range.ts";
import { parseRange } from "./parse_range.ts";
import { parse } from "./parse.ts";

/**
 * Returns the lowest version in the list that satisfies the range, or `undefined` if
 * none of them do.
 * @param versions The versions to check.
 * @param range The range of possible versions to compare to.
 * @returns The lowest version in versions that satisfies the range.
 */
export function minSatisfying(
  versions: SemVer[],
  range: SemVerRange,
): SemVer | undefined;
/**
 * @deprecated (will be removed after 0.200.0) Use `minSatisfying(versions: SemVer[], range: SemVerRange)` instead.
 */
export function minSatisfying<T extends string | SemVer>(
  versions: readonly T[],
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): T | undefined;
export function minSatisfying(
  versions: readonly SemVer[],
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): SemVer | undefined {
  const r = typeof range === "string" ? parseRange(range) : range;
  const satisfying = versions.filter((v) =>
    testRange(typeof v === "string" ? parse(v, options) : v, r)
  );
  const sorted = sort(satisfying);
  return sorted.shift();
}
