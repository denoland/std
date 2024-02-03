// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer, SemVerRange } from "./types.ts";
import { rangeMax } from "./range_max.ts";
import { greaterThan } from "./greater_than.ts";

/** Checks to see if the version is greater than all possible versions of the range. */
export function gtr(
  version: SemVer,
  range: SemVerRange | Range,
): boolean {
  return greaterThan(version, rangeMax(range));
}
