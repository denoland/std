// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { gt } from "./gt.ts";
import { lt } from "./lt.ts";
import type { Range, SemVer, SemVerRange } from "./types.ts";
import { rangeMax } from "./range_max.ts";
import { rangeMin } from "./range_min.ts";

/**
 * Returns true if the version is outside the bounds of the range in either the
 * high or low direction. The hilo argument must be either the string '>' or
 * '<'. (This is the function called by {@linkcode gtr} and {@linkcode ltr}.)
 * @param version The version to compare to the range
 * @param range The range of possible versions
 * @param hilo The operator for the comparison or both if undefined.
 * @returns True if the version is outside of the range based on the operator
 *
 * @deprecated (will be removed in 0.216.0) Use {@linkcode gtr}, {@linkcode ltr} or {@linkcode testRange} instead.
 */
export function outside(
  version: SemVer,
  range: SemVerRange | Range,
  hilo?: ">" | "<",
): boolean {
  switch (hilo) {
    case ">":
      return gt(version, rangeMax(range));
    case "<":
      return lt(version, rangeMin(range));
    default:
      return lt(version, rangeMin(range)) || gt(version, rangeMax(range));
  }
}
