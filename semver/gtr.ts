// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVerRange } from "./range.ts";
import { SemVer } from "./semver.ts";
import { outside } from "./outside.ts";

/** Checks to see if the version is greater than all possible versions of the range. */
export function gtr(
  version: SemVer,
  range: SemVerRange,
): boolean;
/**
 * @deprecated (will be removed after 0.189.0) Use `gtr(version: SemVer, range: SemVerRange)` instead.
 *
 * Checks to see if the version is greater than all possible versions of the range. */
export function gtr(
  version: string | SemVer,
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): boolean;
export function gtr(
  version: string | SemVer,
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): boolean {
  return outside(version, range, ">", options);
}
