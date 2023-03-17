import { SemVerRange } from "../range.ts";
import { SemVer } from "../semver.ts";
import { outside } from "./outside.ts";

/**
 * Checks to see if the version is greater than all possible versions of the range.
 * @param version The version to compare to the range
 * @param range The range of the comparison
 * @returns True if version is greater than the range
 */
export function gtr(
  version: SemVer,
  range: SemVerRange,
): boolean {
  return outside(version, range, ">");
}
