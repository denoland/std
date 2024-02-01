// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { greaterThan } from "./greater_than.ts";
import { SemVer } from "./types.ts";

/**
 * Greater than comparison
 *
 * @deprecated (will be removed in 0.215.0) Use {@linkcode greaterThan} instead.
 */
export function gt(s0: SemVer, s1: SemVer): boolean {
  return greaterThan(s0, s1);
}
