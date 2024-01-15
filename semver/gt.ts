// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { greater } from "./greater.ts";
import { SemVer } from "./types.ts";

/**
 * Greater than comparison
 *
 * @deprecated (will be removed after 0.213.0) Use {@linkcode greater} instead.
 */
export function gt(s0: SemVer, s1: SemVer): boolean {
  return greater(s0, s1);
}
