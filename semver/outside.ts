// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { greaterThan } from "./greater_than.ts";
import { lessThan } from "./less_than.ts";
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
 * @deprecated (will be removed in 0.215.0) Use {@linkcode gtr}, {@linkcode ltr} or {@linkcode testRange} instead.
 */
export function outside(
  version: SemVer,
  range: SemVerRange | Range,
  hilo?: ">" | "<",
): boolean {
  switch (hilo) {
    case ">":
      return greaterThan(version, rangeMax(range));
    case "<":
      return lessThan(version, rangeMin(range));
    default:
      return lessThan(version, rangeMin(range)) ||
        greaterThan(version, rangeMax(range));
  }
}
