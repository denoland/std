// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { less } from "./less.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode less} instead.
 *
 * Less than comparison
 */
export function lt(s0: SemVer, s1: SemVer): boolean {
  return less(s0, s1);
}
