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

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

export const FULL_REGEXP =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*))?(?:\+([\dA-Z-]+(?:\.[\da-z-]+)*))?$/i;
export const XRANGE_REGEXP =
  /^((?:<|>)?=?)\s*[v=\s]*(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*)))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?)?)?$/i;
export const TILDE_REGEXP =
  /^(?:~>?)[v=\s]*(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*)))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?)?)?$/i;
export const CARET_REGEXP =
  /^(?:\^)[v=\s]*(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*)))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?)?)?$/i;
export const COMPARATOR_REGEXP =
  /^((?:<|>)?=?)\s*(v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?)$|^$/i;
export const HYPHENRANGE_REGEXP =
  /^\s*([v=\s]*(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z\d-]*))*)))?(?:\+([\da-z-]+(?:\.[\da-z-]+)*))?)?)?)\s+-\s+([v=\s]*(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:\.(0|[1-9]\d*|x|\*)(?:(?:-((?:0|[1-9]\d*|\d*[a-z-][a-z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][a-z0-9-]*))*)))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?)?)?)\s*$/i;
export const STAR_REGEXP = /(<|>)?=?\s*\*/;

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
 * the regular expression /[0-9A-Z-]+/.i
 * @param value The value to check
 * @returns True if the value is a valid semver string.
 */
export function isValidString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_LENGTH &&
    !!value.match(/[a-z0-9-]+/i)
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
