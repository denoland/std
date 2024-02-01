// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { equals } from "./equals.ts";
import { SemVer } from "./types.ts";

/**
 * Returns `true` if they're logically equivalent, even if they're not the exact same version object.
 *
 * @deprecated (will be removed in 0.215.0) Use {@linkcode equals} instead.
 */
export function eq(s0: SemVer, s1: SemVer): boolean {
  return equals(s0, s1);
}
