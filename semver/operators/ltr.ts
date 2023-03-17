import { SemVerRange } from "../range.ts";
import { SemVer } from "../semver.ts";
import { outside } from "./outside.ts";

/**
 * Greater than range comparison
 * @param version The version to compare to the range
 * @param s1 The range of possible values
 * @returns True if version is less than the min version of the range
 */
export function ltr(
  version: SemVer,
  range: SemVerRange,
): boolean {
  return outside(version, range, "<");
}
