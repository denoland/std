// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVerComparator } from "./comparator.ts";
import { SemVerRange } from "./range.ts";
import { SemVer } from "./semver.ts";
import { FormatStyle } from "./types.ts";

/**
 * Format a SemVer object into a string.
 *
 * If any number is NaN then NaN will be printed.
 *
 * If any number is positive or negative infinity then '∞' or '⧞' will be printed instead.
 *
 * @param semver The semantic version to format
 * @returns The string representation of a smenatic version.
 */
export function format(semver: SemVer, style: FormatStyle = "full") {
  const major = formatNumber(semver.major);
  const minor = formatNumber(semver.minor);
  const patch = formatNumber(semver.patch);
  const pre = semver.prerelease.join(".");
  const build = semver.build.join(".");

  const primary = `${major}.${minor}.${patch}`;
  const release = [primary, pre].filter((v) => v).join("-");
  const full = [release, build].filter((v) => v).join("+");
  //           ┌───── full
  //       ┌───┴───┐
  //       ├───────── release
  //   ┌───┴───┐   │
  //   ├───────────── primary
  // ┌─┴─┐     │   │
  // 1.2.3-pre.1+b.1
  // │ │ │ └─┬─┘ └┬┘
  // │ │ │   │    └── build
  // │ │ │   └─────── pre
  // │ │ └─────────── patch
  // │ └───────────── minor
  // └─────────────── major
  switch (style) {
    case "full":
      return full;
    case "release":
      return release;
    case "primary":
      return primary;
    case "build":
      return build;
    case "pre":
      return pre;
    case "patch":
      return patch;
    case "minor":
      return minor;
    case "major":
      return major;
  }
}

/**
 * Formats the comparator into a string
 * @example >=0.0.0
 * @param comparator
 * @returns A string representation of the comparator
 */
export function comparatorFormat(comparator: SemVerComparator) {
  const { semver, operator } = comparator;
  return `${operator}${format(semver)}`;
}

/**
 * Formats teh range into a string
 * @example >=0.0.0 || <1.0.0
 * @param range The range to format
 * @returns A string representation of the range
 */
export function rangeFormat(range: SemVerRange) {
  return range.ranges.map((c) => c.map((c) => c.toString()).join(" ")).join(
    " || ",
  );
}

function formatNumber(value: number) {
  if (value === Number.POSITIVE_INFINITY) {
    return "∞";
  } else if (value === Number.NEGATIVE_INFINITY) {
    return "⧞";
  } else {
    return value.toFixed(0);
  }
}
