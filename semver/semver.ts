// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * A SemVer object parsed into its consituent parts.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: (string | number)[];
  build: string[];
}

/**
 * MAX is a sentinel value used by some range calculations.
 * It is equivalent to `9007199254740991.9007199254740991.9007199254740991`.
 */
export const MAX: SemVer = {
  major: Number.MAX_SAFE_INTEGER,
  minor: Number.MAX_SAFE_INTEGER,
  patch: Number.MAX_SAFE_INTEGER,
  prerelease: [],
  build: [],
};

/**
 * The minimum valid SemVer objecct. Equivalent to `0.0.0`.
 */
export const MIN: SemVer = {
  major: 0,
  minor: 0,
  patch: 0,
  prerelease: [],
  build: [],
};

/**
 * A sentinel value used to denoate an invalid SemVer object
 * which may be the result of impossible ranges or comparator operations.
 * @example `eq(parseRange("<0.0.0"), INVALID)`
 */
export const INVALID: SemVer = {
  major: Number.NaN,
  minor: Number.NaN,
  patch: Number.NaN,
  prerelease: [],
  build: [],
};

/**
 * ANY is a sentinel value used by some range calculations. It is not a valid
 * SemVer object and should not be used directly.
 * @example `eq(parseRange("*.*.*"), ANY)`
 */
export const ANY: SemVer = {
  major: Number.NaN,
  minor: Number.NaN,
  patch: Number.NaN,
  prerelease: [],
  build: [],
};
