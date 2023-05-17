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
