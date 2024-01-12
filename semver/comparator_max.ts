// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Operator, SemVer } from "./types.ts";
import * as c from "./_comparator.ts";

/**
 * The maximum version that could match this comparator.
 *
 * If an invalid comparator is given such as <0.0.0 then
 * an out of range semver will be returned.
 * @returns the version, the MAX version or the next smallest patch version
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode rangeMax} instead.
 */
export function comparatorMax(semver: SemVer, operator: Operator): SemVer {
  return c.comparatorMax(semver, operator);
}
