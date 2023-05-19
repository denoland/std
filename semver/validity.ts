// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
export const MAX_LENGTH = 256;

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_semver.ts` instead.
   *
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
  isSemVer,
} from "./is_semver.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_semver_comparator.ts` instead.
   *
   * Does a deep check on the value to see if it is a valid SemVerComparator object.
   *
   * Objects with extra fields are still considered valid if they have at
   * least the correct fields.
   *
   * Adds a type assertion if true.
   * @param value The value to check if its a SemVerComparator
   * @returns True if the object is a SemVerComparator otherwise false
   */
  isSemVerComparator,
} from "./is_semver_comparator.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_semver_range.ts` instead.
   *
   * Does a deep check on the object to determine if its a valid range.
   *
   * Objects with extra fields are still considered valid if they have at
   * least the correct fields.
   *
   * Adds a type assertion if true.
   * @param value The value to check if its a valid SemVerRange
   * @returns True if its a valid SemVerRange otherwise false.
   */
  isSemVerRange,
} from "./is_semver_range.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_valid_operator.ts` instead.
   *
   * Checks to see if the value is a valid Operator string.
   *
   * Adds a type assertion if true.
   * @param value The value to check
   * @returns True if the value is a valid Operator string otherwise false.
   */
  isValidOperator,
} from "./is_valid_operator.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_valid_number.ts` instead.
   *
   * Returns true if the value is a valid SemVer number.
   *
   * Must be a number. Must not be NaN. Can be positive or negative infinity.
   * Can be between 0 and MAX_SAFE_INTEGER.
   * @param value The value to check
   * @returns True if its a valid semver number
   */
  isValidNumber,
} from "./is_valid_number.ts";

export {
  /**
   * @deprecated (will be removed after 0.191.0) Import from `std/semver/is_valid_string.ts` instead.
   *
   * Returns true if the value is a valid semver pre-release or build identifier.
   *
   * Must be a string. Must be between 1 and 256 characters long. Must match
   * the regular expression /[0-9A-Za-z-]+/.
   * @param value The value to check
   * @returns True if the value is a valid semver string.
   */
  isValidString,
} from "./is_valid_string.ts";
