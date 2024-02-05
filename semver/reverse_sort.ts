// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { SemVer } from "./types.ts";
import { compare } from "./compare.ts";
import { warnOnDeprecatedApi } from "https://deno.land/std@$STD_VERSION/internal/warn_on_deprecated_api.ts";

/**
 * Sorts a list of semantic versions in descending order.
 * @deprecated (will be removed in 0.217.0) Use `versions.sort((a, b) => compare(b, a))` instead.
 */
export function reverseSort(
  versions: SemVer[],
): SemVer[] {
  warnOnDeprecatedApi({
    apiName: "reverseSort",
    stack: new Error().stack!,
    removalVersion: "0.217.0",
    suggestion: "Use `versions.sort((a, b) => compare(b, a))` instead.",
  });
  return versions.sort((a, b) => compare(b, a));
}
