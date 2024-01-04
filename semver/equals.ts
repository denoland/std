// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { compare } from "./compare.ts";
import type { SemVer } from "./types.ts";

/**
 * @returns `true` if they're logically equivalent, even if they're not the exact same version object.
 *
 * This is equal to `compare(s0, s1) === 0`.
 */
export function equals(s0: SemVer, s1: SemVer): boolean {
  return compare(s0, s1) === 0;
}
