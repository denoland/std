// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";

/** Less than comparison */
export function lt(
  s0: SemVer,
  s1: SemVer,
): boolean;
/**
 * @deprecated (will be removed after 0.200.0) Use `lt(s0: SemVer, s1: SemVer)` instead.
 *
 * Less than comparison */
export function lt(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean;
export function lt(
  s0: string | SemVer,
  s1: string | SemVer,
  options?: { includePrerelease: boolean },
): boolean {
  return compare(s0, s1, options) < 0;
}
