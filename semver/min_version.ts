// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import type { Range, SemVer } from "./types.ts";
import { greaterThan } from "./greater_than.ts";
import { satisfies } from "./satisfies.ts";

/**
 * Returns the lowest version that satisfies the range, or `undefined` if no
 * version satisfies the range.
 *
 * @example Usage
 * ```ts
 * import { minVersion, parseRange, parse } from "@std/semver";
 * import { assertEquals } from "@std/assert";
 *
 * const range = parseRange(">=1.0.0 <2.0.0");
 * assertEquals(minVersion(range), parse("1.0.0"));
 *
 * const range2 = parseRange(">1.0.0");
 * assertEquals(minVersion(range2), parse("1.0.1"));
 *
 * const range3 = parseRange(">1.0.0-0");
 * assertEquals(minVersion(range3), parse("1.0.0-0.0"));
 * ```
 *
 * @param range The range to find the minimum version for.
 * @returns The minimum version that satisfies the range, or `undefined`.
 */
export function minVersion(range: Range): SemVer | undefined {
  const ZERO: SemVer = {
    major: 0,
    minor: 0,
    patch: 0,
  };
  if (satisfies(ZERO, range)) return ZERO;

  const ZERO_PRE: SemVer = {
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: [0],
    build: [],
  };
  if (satisfies(ZERO_PRE, range)) return ZERO_PRE;

  let minver: SemVer | undefined;

  for (const comparators of range) {
    let setMin: SemVer | undefined;

    for (const comparator of comparators) {
      const compver: SemVer = {
        major: comparator.major,
        minor: comparator.minor,
        patch: comparator.patch,
        prerelease: [...(comparator.prerelease ?? [])],
        build: [...(comparator.build ?? [])],
      };

      switch (comparator.operator) {
        case ">":
          if (!compver.prerelease || compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease = [...compver.prerelease, 0];
          }
        // falls through
        case "=":
        case undefined:
        case ">=":
          if (!setMin || greaterThan(compver, setMin)) {
            setMin = compver;
          }
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operator: ${comparator.operator}`);
      }
    }

    if (setMin && (!minver || greaterThan(minver, setMin))) {
      minver = setMin;
    }
  }

  if (minver && satisfies(minver, range)) {
    return minver;
  }
}
