// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/**
 * Greater than or equal to comparison
 * @deprecated (will be removed in 0.213.0) use {@linkcode compare} instead.
 *
 * This is equal to `compare(s0, s1) >= 0`
 */
export function gte(
  s0: SemVer,
  s1: SemVer,
): boolean {
  return compare(s0, s1) >= 0;
}
