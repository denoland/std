// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { lessThan } from "./less_than.ts";
import { SemVer } from "./types.ts";

/**
 * Less than comparison
 *
 * @deprecated (will be removed in 0.215.0) Use {@linkcode lessThan} instead.
 */
export function lt(s0: SemVer, s1: SemVer): boolean {
  return lessThan(s0, s1);
}
