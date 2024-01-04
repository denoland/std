// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { lessOrEqual } from "./less_or_equal.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode lessOrEqual} instead.
 *
 * Less than or equal to comparison
 */
export function lte(s0: SemVer, s1: SemVer): boolean {
  return lessOrEqual(s0, s1);
}
