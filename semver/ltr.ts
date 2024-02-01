// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer } from "./types.ts";
import { lessThan } from "./less_than.ts";
import { rangeMin } from "./range_min.ts";

/** Less than range comparison */
export function ltr(
  version: SemVer,
  range: Range,
): boolean {
  return lessThan(version, rangeMin(range));
}
