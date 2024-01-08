// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { lessThan } from "./less_than.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode lessThan} instead.
 *
 * Less than comparison
 */
export function lt(s0: SemVer, s1: SemVer): boolean {
  return lessThan(s0, s1);
}
