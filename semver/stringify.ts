// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { ANY } from "./constants.ts";
import type { SemVer } from "./types.ts";

function formatNumber(value: number) {
  if (value === Number.POSITIVE_INFINITY) {
    return "∞";
  } else if (value === Number.NEGATIVE_INFINITY) {
    return "⧞";
  } else {
    return value.toFixed(0);
  }
}

/**
 * Format a SemVer object into a string.
 *
 * If any number is NaN then NaN will be printed.
 *
 * If any number is positive or negative infinity then '∞' or '⧞' will be printed instead.
 *
 * @param semver The semantic version to format
 * @returns The string representation of a semantic version.
 */
export function stringify(semver: Partial<SemVer>) {
  if (semver === ANY) {
    return "*";
  }

  let output = "";

  if (semver.major !== undefined) {
    output += formatNumber(semver.major);
  }
  if (semver.minor !== undefined) {
    output += output ? "." : "";
    output += formatNumber(semver.minor);
  }
  if (semver.patch !== undefined) {
    output += output ? "." : "";
    output += formatNumber(semver.patch);
  }
  const prerelease = semver.prerelease?.join(".");
  if (prerelease) {
    output += output ? "-" : "";
    output += prerelease;
  }
  const build = semver.build?.join(".");
  if (build) {
    output += output ? "+" : "";
    output += build;
  }

  return output;
}
