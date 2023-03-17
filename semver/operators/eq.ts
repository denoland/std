import { compare } from "./compare.ts";
import { SemVer } from "../semver.ts";

/**
 * Returns `true` if they're logically equivalent, even if they're not the exact
 * same version object.
 * @param s0 A semantic version
 * @param s1 A semantic version
 * @returns True if both are equal
 */
export function eq(
  s0: SemVer,
  s1: SemVer,
): boolean {
  return compare(s0, s1) === 0;
}
