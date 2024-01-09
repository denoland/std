// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { greaterThanOrEquals } from "./greater_than_or_equals.ts";
import { SemVer } from "./types.ts";

/**
 * Greater than or equal to comparison
 *
 * @deprecated (will be removed after 0.213.0) Use {@linkcode greaterThanOrEquals} instead.
 */
export function gte(s0: SemVer, s1: SemVer): boolean {
  return greaterThanOrEquals(s0, s1);
}
