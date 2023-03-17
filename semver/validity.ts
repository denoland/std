// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license."
import { ALL, NONE, SemVerComparator } from "./comparator.ts";
import { SemVerRange } from "./range.ts";
import { ANY, INVALID, SemVer } from "./semver.ts";
import { Operator } from "./types.ts";

export const MAX_LENGTH = 256;

/**
 * Checks to see if value is a valid SemVer object. It does a check
 * into each field including prerelease and build.
 *
 * Some invalid SemVer sentinals can still return true such as ANY and INVALID.
 * An object which has the same value as a sentinal but isn't reference equal
 * will still fail.
 *
 * Objects which are valid SemVer objects but have _extra_ fields are still
 * considered SemVer objects and this will return true.
 *
 * A type assertion is added to the value.
 * @param value The value to check to see if its a valid SemVer object
 * @returns True if value is a valid SemVer otherwise false
 */
export function isSemVer(value: unknown): value is SemVer {
  if (value == null) return false;
  if (Array.isArray(value)) return false;
  if (typeof value !== "object") return false;
  if (value === INVALID) return true;
  if (value === ANY) return true;

  const { major, minor, patch, build, prerelease } = value as Record<
    string,
    unknown
  >;
  const result = typeof major === "number" && isValidNumber(major) &&
    typeof minor === "number" && isValidNumber(minor) &&
    typeof patch === "number" && isValidNumber(patch) &&
    Array.isArray(prerelease) &&
    Array.isArray(build) &&
    prerelease.every((v) => typeof v === "string" || typeof v === "number") &&
    prerelease.filter((v) => typeof v === "string").every((v) =>
      isValidString(v)
    ) &&
    prerelease.filter((v) => typeof v === "number").every((v) =>
      isValidNumber(v)
    ) &&
    build.every((v) => typeof v === "string" && isValidString(v));
  if (!result) console.log({ isSemVer: false, value });
  return result;
}

/**
 * Does a deep check on the value to see if it is a valid SemVerComparator object.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a SemVerComparator
 * @returns True if the object is a SemVerComparator otherwise false
 */
export function isSemVerComparator(value: unknown): value is SemVerComparator {
  if (value == null) return false;
  if (value === NONE) return true;
  if (value === ALL) return true;
  if (Array.isArray(value)) return false;
  if (typeof value !== "object") return false;
  const { operator, semver, min, max } = value as SemVerComparator;
  return (
    isValidOperator(operator) &&
    isSemVer(semver) &&
    isSemVer(min) &&
    isSemVer(max)
  );
}

/**
 * Does a deep check on the object to determine if its a valid range.
 *
 * Objects with extra fields are still considered valid if they have at
 * least the correct fields.
 *
 * Adds a type assertion if true.
 * @param value The value to check if its a valid SemVerRange
 * @returns True if its a valid SemVerRange otherwise false.
 */
export function isSemVerRange(value: unknown): value is SemVerRange {
  if (value == null) return false;
  if (Array.isArray(value)) return false;
  if (typeof value !== "object") return false;
  const { ranges } = value as SemVerRange;
  return (
    Array.isArray(ranges),
      ranges.every((r) =>
        Array.isArray(r) && r.every((c) => isSemVerComparator(c))
      )
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
    !isNaN(value) && (
      value === Number.POSITIVE_INFINITY ||
      value === Number.NEGATIVE_INFINITY ||
      (
        value <= Number.MAX_SAFE_INTEGER &&
        value >= 0
      )
    )
  );
}

/**
 * Returns true if the value is a valid semver prerelase or build identifier.
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
