// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Operator, SemVer } from "./types.ts";
import * as c from "./_comparator.ts";

/**
 * The minimum semantic version that could match this comparator
 * @param semver The semantic version of the comparator
 * @param operator The operator of the comparator
 * @returns The minimum valid semantic version
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode rangeMin} instead.
 */
export function comparatorMin(semver: SemVer, operator: Operator): SemVer {
  return c.comparatorMin(semver, operator);
}
