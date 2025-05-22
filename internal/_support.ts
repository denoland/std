// Copyright 2018-2025 the Deno authors. MIT license.
import { greaterOrEqual } from "../semver/greater_or_equal.ts";
import { parse } from "../semver/parse.ts";

/**
 * Checks if the current Deno version is greater than or equal to the specified
 * minimum version.
 *
 * @param minVersion Minimum version to check against.
 * @returns `true` if the current Deno version is greater than or equal to the
 * specified minimum version, `false` otherwise.
 */
export function isDenoVersionGreaterOrEqual(minVersion: string): boolean {
  // deno-lint-ignore no-explicit-any
  return (Deno.version as any) &&
    greaterOrEqual(parse(Deno.version.deno), parse(minVersion));
}

export const IS_LINT_PLUGIN_SUPPORTED = isDenoVersionGreaterOrEqual("2.2.0");

export const IS_DENO_2 = isDenoVersionGreaterOrEqual("2.0.0");
