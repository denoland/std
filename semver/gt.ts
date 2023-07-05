// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/** Greater than comparison */
export function gt(
  s0: SemVer,
  s1: SemVer,
): boolean;
/**
 * @deprecated (will be removed after 0.200.0) Use `gt(s0: SemVer, s1: SemVer)` instead.
 *
 * Greater than comparison */
export function gt(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean;
export function gt(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean {
  return compare(s0, s1, options) > 0;
}
