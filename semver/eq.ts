// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { compare } from "./compare.ts";
import type { SemVer } from "./types.ts";

/** Returns `true` if they're logically equivalent, even if they're not the exact
 * same version object. */
export function eq(s0: SemVer, s1: SemVer): boolean;
/** @deprecated (will be removed after 0.200.0) Use `eq(s0: SemVer, s1: SemVer)` instead.
 *
 * Returns `true` if they're logically equivalent, even if they're not the exact
 * same version object. */
export function eq(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean;
export function eq(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean {
  return compare(s0, s1, options) === 0;
}
