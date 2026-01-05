// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * The possible release types are used as an operator for the
 * increment function and as a result of the difference function.
 */
export type ReleaseType =
  | "pre"
  | "major"
  | "premajor"
  | "minor"
  | "preminor"
  | "patch"
  | "prepatch"
  | "prerelease";

/**
 * SemVer comparison operators.
 */
export type Operator =
  | undefined
  | "="
  // Note: `!=` operator type does not exist in npm:semver
  | "!="
  | ">"
  | ">="
  | "<"
  | "<=";

/**
 * The shape of a valid SemVer comparator.
 *
 * @example Usage
 * ```ts
 * import type { Comparator } from "@std/semver/types";
 *
 * const comparator: Comparator = {
 *   operator: ">",
 *   major: 1,
 *   minor: 2,
 *   patch: 3,
 * }
 * ```
 */
export interface Comparator extends SemVer {
  /** The operator */
  operator?: Operator;
}

/**
 * A SemVer object parsed into its constituent parts.
 */
export interface SemVer {
  /** The major version */
  major: number;
  /** The minor version */
  minor: number;
  /** The patch version */
  patch: number;
  /**
   * The prerelease version
   *
   * @default {[]}
   */
  prerelease?: (string | number)[];
  /**
   * The build metadata
   *
   * @default {[]}
   */
  build?: string[];
}

/**
 * A type representing a semantic version range. The ranges consist of
 * a nested array, which represents a set of OR comparisons while the
 * inner array represents AND comparisons.
 */
export type Range = Comparator[][];
