// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Range, SemVer, SemVerRange } from "./types.ts";
import { rangeMax } from "./range_max.ts";
import { greaterThan } from "./greater_than.ts";
import { warnOnDeprecatedApi } from "../internal/warn_on_deprecated_api.ts";

/**
 * Checks to see if the version is greater than all possible versions of the range.
 * @deprecated (will be removed after 0.215.0) Use `greaterThan(version, rangeMax(range))` instead.
 */
export function gtr(
  version: SemVer,
  range: SemVerRange | Range,
): boolean {
  warnOnDeprecatedApi({
    apiName: "gtr",
    stack: new Error().stack!,
    removalVersion: "0.215.0",
    suggestion: "Use 'greaterThan(version, rangeMax(range))' instead.",
  });
  return greaterThan(version, rangeMax(range));
}
