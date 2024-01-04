// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { equals } from "./equals.ts";
import { SemVer } from "./types.ts";

/**
 * @deprecated (will be removed after 0.213.0) Use {@linkcode equals} instead.
 *
 * Returns `true` if they're logically equivalent, even if they're not the exact same version object.
 */
export function eq(s0: SemVer, s1: SemVer): boolean {
  return equals(s0, s1);
}
