// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { parseBuild, parseNumber, parsePrerelease } from "./_shared.ts";
import { FULL_REGEXP, MAX_LENGTH } from "./_shared.ts";

/**
 * Attempt to parse a string as a semantic version, returning a SemVer object.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/semver/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const version = parse("1.2.3");
 * assertEquals(version, {
 *   major: 1,
 *   minor: 2,
 *   patch: 3,
 *   prerelease: [],
 *   build: [],
 * });
 * ```
 *
 * @throws {TypeError} If the input string is invalid.
 * @param value The version string to parse
 * @returns A valid SemVer
 */
export function parse(value: string): SemVer {
  if (typeof value !== "string") {
    throw new TypeError(
      `version must be a string`,
    );
  }

  if (value.length > MAX_LENGTH) {
    throw new TypeError(
      `version is longer than ${MAX_LENGTH} characters`,
    );
  }

  value = value.trim();

  const groups = value.match(FULL_REGEXP)?.groups;
  if (!groups) throw new TypeError(`Invalid version: ${value}`);

  const major = parseNumber(groups.major!, "Invalid major version");
  const minor = parseNumber(groups.minor!, "Invalid minor version");
  const patch = parseNumber(groups.patch!, "Invalid patch version");

  const prerelease = groups.prerelease
    ? parsePrerelease(groups.prerelease)
    : [];
  const build = groups.buildmetadata ? parseBuild(groups.buildmetadata) : [];

  return { major, minor, patch, prerelease, build };
}
