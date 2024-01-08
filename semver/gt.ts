// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { greaterThan } from "./greater_than.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode greaterThan} instead.
 *
 * Greater than comparison
 */
export function gt(s0: SemVer, s1: SemVer): boolean {
  return greaterThan(s0, s1);
}
