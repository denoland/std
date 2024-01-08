// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { lessThanOrEqual } from "./less_than_or_equal.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode lessThanOrEqual} instead.
 *
 * Less than or equal to comparison
 */
export function lte(s0: SemVer, s1: SemVer): boolean {
  return lessThanOrEqual(s0, s1);
}
