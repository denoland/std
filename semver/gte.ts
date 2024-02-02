// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { greaterOrEqual } from "./greater_or_equal.ts";
import { SemVer } from "./types.ts";

/**
 * Greater than or equal to comparison
 *
 * @deprecated (will be removed in 0.216.0) Use {@linkcode greaterOrEqual} instead.
 */
export function gte(s0: SemVer, s1: SemVer): boolean {
  return greaterOrEqual(s0, s1);
}
