// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVerRange } from "./range.ts";
import { SemVer } from "./semver.ts";
import { outside } from "./_outside.ts";
import { parse, parseRange } from "./parse.ts";

/** Checks to see if the version is greater than all possible versions of the range. */
export function gtr(
  version: SemVer,
  range: SemVerRange,
): boolean;
/** 
 * @deprecated (will be removed after 0.189.0) Use `lte(s0: SemVer, s1: SemVer)` instead.
 * 
 * Checks to see if the version is greater than all possible versions of the range. */
export function gtr(
  version: string | SemVer,
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): boolean;
export function gtr(
  v: string | SemVer,
  r: string | SemVerRange,
  _options?: { includePrerelease: boolean },
): boolean {
  const version = typeof v === "string" ? parse(v) : v;
  const range = typeof r === "string" ? parseRange(r) : r;
  return outside(version, range, ">");
}
