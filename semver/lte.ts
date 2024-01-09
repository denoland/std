// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { lessThanOrEquals } from "./less_than_or_equals.ts";
import { SemVer } from "./types.ts";

/**
 * Less than or equal to comparison
 *
 * @deprecated (will be removed after 0.213.0) Use {@linkcode lessThanOrEquals} instead.
 */
export function lte(s0: SemVer, s1: SemVer): boolean {
  return lessThanOrEquals(s0, s1);
}
