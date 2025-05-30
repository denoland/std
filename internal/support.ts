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
 *
 * @example Basic usage
 * ```ts no-assert
 * import { isDenoVersionGreaterOrEqual } from "@std/internal/support";
 *
 * if (isDenoVersionGreaterOrEqual("1.0.0")) {
 *   console.log("Deno version is greater than or equal to 1.0.0");
 * } else {
 *   console.log("Deno version is less than 1.0.0");
 * }
 * ```
 */
export function isDenoVersionGreaterOrEqual(minVersion: string): boolean {
  // deno-lint-ignore no-explicit-any
  return (Deno.version as any) &&
    greaterOrEqual(parse(Deno.version.deno), parse(minVersion));
}

/**
 * Whether the current Deno version supports the
 * {@link https://docs.deno.com/runtime/reference/lint_plugins/ | lint plugin API}.
 */
export const IS_LINT_PLUGIN_SUPPORTED: boolean = isDenoVersionGreaterOrEqual(
  "2.2.0",
);
