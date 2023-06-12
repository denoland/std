// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { Operator, SemVer } from "./types.ts";
import { eq } from "./eq.ts";
import { neq } from "./neq.ts";
import { gte } from "./gte.ts";
import { gt } from "./gt.ts";
import { lt } from "./lt.ts";
import { lte } from "./lte.ts";

/**
 * Do a comparison of two semantic version objects based on the given operator
 * @param s0 The left side of the comparison
 * @param operator The operator to use for the comparison
 * @param s1 The right side of the comparison
 * @returns True or false based on the operator
 */
export function cmp(
  s0: SemVer,
  operator: Operator,
  s1: SemVer,
): boolean;
/** @deprecated (will be removed after 0.200.0) Use `cmp(s0: SemVer, operator: Operator, s1: SemVer)` instead. */
export function cmp(
  s0: string | SemVer,
  operator: Operator,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean;
export function cmp(
  s0: string | SemVer,
  operator: Operator,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean {
  switch (operator) {
    case "":
    case "=":
    case "==":
    case "===":
      return eq(s0, s1, options);

    case "!=":
    case "!==":
      return neq(s0, s1, options);

    case ">":
      return gt(s0, s1, options);

    case ">=":
      return gte(s0, s1, options);

    case "<":
      return lt(s0, s1, options);

    case "<=":
      return lte(s0, s1, options);

    default:
      throw new TypeError(`Invalid operator: ${operator}`);
  }
}
