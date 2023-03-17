import { SemVer } from "../semver.ts";
import { compare } from "./compare.ts";

/**
 * Greater than comparison
 * @param s0 Left side of the comparison
 * @param s1 Right side of the comparison
 * @returns True if s0 is greater than s1 otherwise false
 */
export function gt(
  s0: SemVer,
  s1: SemVer,
): boolean {
  return compare(s0, s1) > 0;
}
