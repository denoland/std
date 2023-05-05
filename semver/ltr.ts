// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVerRange } from "./range.ts";
import { SemVer } from "./semver.ts";
import { outside } from "./outside.ts";
import { parse, parseRange } from "./parse.ts";

/** Greater than range comparison */
export function ltr(
  version: SemVer,
  range: SemVerRange,
): boolean;
/** Greater than range comparison */
export function ltr(
  version: string | SemVer,
  range: string | SemVerRange,
  options?: { includePrerelease: boolean },
): boolean;
export function ltr(
  v: string | SemVer,
  r: string | SemVerRange,
  _options?: { includePrerelease: boolean },
): boolean {
  const version = typeof v === "string" ? parse(v) : v;
  const range = typeof r === "string" ? parseRange(r) : r;
  return outside(version, range, "<");
}
