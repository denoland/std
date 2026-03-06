// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";

function formatNumber(value: number) {
  return value.toFixed(0);
}

/**
 * Format a SemVer object into a string.
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/semver/format";
 * import { assertEquals } from "@std/assert";
 *
 * const semver = {
 *   major: 1,
 *   minor: 2,
 *   patch: 3,
 * };
 * assertEquals(format(semver), "1.2.3");
 * ```
 *
 * @param version The SemVer to format
 * @returns The string representation of a semantic version.
 */
export function format(version: SemVer): string {
  const major = formatNumber(version.major);
  const minor = formatNumber(version.minor);
  const patch = formatNumber(version.patch);
  const pre = version.prerelease?.join(".") ?? "";
  const build = version.build?.join(".") ?? "";

  const primary = `${major}.${minor}.${patch}`;
  const release = [primary, pre].filter((v) => v).join("-");
  return [release, build].filter((v) => v).join("+");
}
