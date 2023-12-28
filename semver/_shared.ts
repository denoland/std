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
  v1: ReadonlyArray<string | number> = [],
  v2: ReadonlyArray<string | number> = [],
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
  v1: ReadonlyArray<string | number> = [],
  v2: ReadonlyArray<string | number> = [],
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

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

const NUMERIC_IDENTIFIER = "0|[1-9]\\d*";

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

const NON_NUMERIC_IDENTIFIER = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";

// ## Main Version
// Three dot-separated numeric identifiers.
const MAIN_VERSION =
  `(?<major>${NUMERIC_IDENTIFIER})\\.(?<minor>${NUMERIC_IDENTIFIER})\\.(?<patch>${NUMERIC_IDENTIFIER})`;

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

const PRERELEASE_IDENTIFIER =
  `(?:${NUMERIC_IDENTIFIER}|${NON_NUMERIC_IDENTIFIER})`;

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

const PRERELEASE =
  `(?:-(?<prerelease>${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))`;

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.
const BUILD_IDENTIFIER = "[0-9A-Za-z-]+";

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.
const BUILD =
  `(?:\\+(?<buildmetadata>${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*))`;

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.
const FULL_PLAIN = `v?${MAIN_VERSION}${PRERELEASE}?${BUILD}?`;

export const FULL_REGEXP = new RegExp(`^${FULL_PLAIN}$`);

const COMPARATOR = "((?:<|>)?=?)";

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifier, meaning "any version"
// Only the first item is strictly required.
const XRANGE_IDENTIFIER = `${NUMERIC_IDENTIFIER}|x|X|\\*`;

export const XRANGE_PLAIN =
  `[v=\\s]*(?<major>${XRANGE_IDENTIFIER})(?:\\.(?<minor>${XRANGE_IDENTIFIER})(?:\\.(?<patch>${XRANGE_IDENTIFIER})(?:${PRERELEASE})?${BUILD}?)?)?`;

export const XRANGE_REGEXP = new RegExp(
  `^${COMPARATOR}\\s*${XRANGE_PLAIN}$`,
);

// Tilde ranges.
// Meaning is "reasonably at or greater than"
export const TILDE_REGEXP = new RegExp(`^(?<operator>~>?)${XRANGE_PLAIN}$`);

// Caret ranges.
// Meaning is "at least and backwards compatible with"
export const CARET_REGEXP = new RegExp(`^(?<operator>\\^)${XRANGE_PLAIN}$`);

// A simple gt/lt/eq thing, or just "" to indicate "any version"
export const COMPARATOR_REGEXP = new RegExp(
  `^${COMPARATOR}\\s*(${FULL_PLAIN})$|^$`,
);

// Star ranges basically just allow anything at all.
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

export const operators = [
  "",
  "=",
  "==",
  "===",
  "!==",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
] as const;

/**
 * Checks to see if the value is a valid Operator string.
 *
 * Adds a type assertion if true.
 * @param value The value to check
 * @returns True if the value is a valid Operator string otherwise false.
 */
export function isOperator(value: unknown): value is Operator {
  return operators.includes(value as Operator);
}
