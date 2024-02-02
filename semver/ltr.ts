// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer, SemVerRange } from "./types.ts";
import { lessThan } from "./less_than.ts";
import { rangeMin } from "./range_min.ts";
import { warnOnDeprecatedApi } from "../internal/warn_on_deprecated_api.ts";

/**
 *  Less than range comparison
 * @deprecated (will be removed after 0.217.0) Use `lessThan(version, rangeMin(range))` instead.
 */
export function ltr(
  version: SemVer,
  range: SemVerRange | Range,
): boolean {
  warnOnDeprecatedApi({
    apiName: "ltr",
    stack: new Error().stack!,
    removalVersion: "0.215.0",
    suggestion: "Use 'lessThan(version, rangeMin(range))' instead.",
  });
  return lessThan(version, rangeMin(range));
}
