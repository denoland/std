import { SemVer } from "../semver.ts";
import { compare } from "./compare.ts";

/**
 * Not equal comparison
 * @param s0 Left side of the comparison
 * @param s1 Right side of the comparison
 * @returns True if s0 is not equal to s1 otherwise false
 */
export function neq(
  s0: SemVer,
  s1: SemVer,
): boolean {
  return compare(s0, s1) !== 0;
}
