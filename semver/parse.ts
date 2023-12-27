// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./types.ts";
import { parseBuild, parsePrerelease } from "./_shared.ts";
import { isSemVer } from "./is_semver.ts";
import { FULL_REGEXP, MAX_LENGTH } from "./_shared.ts";

/**
 * @deprecated (will be removed in 0.212.0) Use a string argument instead.
 */
export function parse(version: SemVer): SemVer;
/**
 * Attempt to parse a string as a semantic version, returning either a `SemVer`
 * object or throws a TypeError.
 * @param version The version string to parse
 * @returns A valid SemVer
 */
export function parse(version: string): SemVer;
export function parse(version: string | SemVer): SemVer {
  if (typeof version === "object") {
    if (isSemVer(version)) {
      return version;
    } else {
      throw new TypeError(`not a valid SemVer object`);
    }
  }
  if (typeof version !== "string") {
    throw new TypeError(
      `version must be a string`,
    );
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError(
      `version is longer than ${MAX_LENGTH} characters`,
    );
  }

  version = version.trim();

  const groups = version.match(FULL_REGEXP)?.groups;
  if (!groups) throw new TypeError(`Invalid Version: ${version}`);

  // these are actually numbers
  const major = parseInt(groups.major);
  const minor = parseInt(groups.minor);
  const patch = parseInt(groups.patch);

  if (major > Number.MAX_SAFE_INTEGER || major < 0) {
    throw new TypeError("Invalid major version");
  }

  if (minor > Number.MAX_SAFE_INTEGER || minor < 0) {
    throw new TypeError("Invalid minor version");
  }

  if (patch > Number.MAX_SAFE_INTEGER || patch < 0) {
    throw new TypeError("Invalid patch version");
  }

  const prerelease = groups.prerelease
    ? parsePrerelease(groups.prerelease)
    : [];
  const build = groups.buildmetadata ? parseBuild(groups.buildmetadata) : [];

  return {
    major,
    minor,
    patch,
    prerelease,
    build,
  };
}
