// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { Operator } from "./types.ts";

export function compareNumber(
  a: number,
  b: number,
): 1 | 0 | -1 {
  if (isNaN(a) || isNaN(b)) {
    throw new Error("Comparison against non-numbers");
  }
  return a === b ? 0 : a < b ? -1 : 1;
}

export function checkIdentifier(
  v1: ReadonlyArray<string | number>,
  v2: ReadonlyArray<string | number>,
): 1 | 0 | -1 {
  // NOT having a prerelease is > having one
  // But NOT having a build is < having one
  if (v1.length && !v2.length) {
    return -1;
  } else if (!v1.length && v2.length) {
    return 1;
  } else {
    return 0;
  }
}

export function compareIdentifier(
  v1: ReadonlyArray<string | number>,
  v2: ReadonlyArray<string | number>,
): 1 | 0 | -1 {
  let i = 0;
  do {
    const a = v1[i];
    const b = v2[i];
    if (a === undefined && b === undefined) {
      // same length is equal
      return 0;
    } else if (b === undefined) {
      // longer > shorter
      return 1;
    } else if (a === undefined) {
      // shorter < longer
      return -1;
    } else if (typeof a === "string" && typeof b === "number") {
      // string > number
      return 1;
    } else if (typeof a === "number" && typeof b === "string") {
      // number < string
      return -1;
    } else if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      // If they're equal, continue comparing segments.
      continue;
    }
  } while (++i);

  // It can't ever reach here, but typescript doesn't realize that so
  // add this line so the return type is inferred correctly.
  return 0;
}

export const FULL_REGEXP =
  /^v?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
export const XRANGE_REGEXP =
  /^(?<operator>(?:<|>)?=?)\s*[v=\s]*(?<major>0|[1-9]\d*|x|X|\*)(?:\.(?<minor>0|[1-9]\d*|x|X|\*)(?:\.(?<patch>0|[1-9]\d*|x|X|\*)(?:(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*))*)))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?)?$/;
export const OPERATOR_REGEXP =
  /^(?<operator>~>?|\^)[v=\s]*(?<major>0|[1-9]\d*|x|X|\*)(?:\.(?<minor>0|[1-9]\d*|x|X|\*)(?:\.(?<patch>0|[1-9]\d*|x|X|\*)(?:(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*))*)))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?)?$/;
export const COMPARATOR_REGEXP =
  /^(?<operator>(?:<|>)?=?)\s*(v?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$|^$/;
export const HYPHENRANGE_REGEXP =
  /^\s*([v=\s]*(?<semver>0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z\d-]*))*)))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?)?)\s+-\s+([v=\s]*(0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][a-zA-Z0-9-]*))*)))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?)?)\s*$/;
export const STAR_REGEXP = /(?<operator>(<|>)?=?)\s*\*/;

/**
 * Returns true if the value is a valid SemVer number.
 *
 * Must be a number. Must not be NaN. Can be positive or negative infinity.
 * Can be between 0 and MAX_SAFE_INTEGER.
 * @param value The value to check
 * @returns True if its a valid semver number
 */
export function isValidNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    !Number.isNaN(value) && (
      !Number.isFinite(value) ||
      (0 <= value && value <= Number.MAX_SAFE_INTEGER)
    )
  );
}

export const MAX_LENGTH = 256;

/**
 * Returns true if the value is a valid semver pre-release or build identifier.
 *
 * Must be a string. Must be between 1 and 256 characters long. Must match
 * the regular expression /[0-9A-Za-z-]+/.
 * @param value The value to check
 * @returns True if the value is a valid semver string.
 */
export function isValidString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_LENGTH &&
    !!value.match(/[0-9A-Za-z-]+/)
  );
}

/**
 * Checks to see if the value is a valid Operator string.
 *
 * Adds a type assertion if true.
 * @param value The value to check
 * @returns True if the value is a valid Operator string otherwise false.
 */
export function isValidOperator(value: unknown): value is Operator {
  if (typeof value !== "string") return false;
  switch (value) {
    case "":
    case "=":
    case "==":
    case "===":
    case "!==":
    case "!=":
    case ">":
    case ">=":
    case "<":
    case "<=":
      return true;
    default:
      return false;
  }
}
