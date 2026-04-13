// Copyright 2018-2026 the Deno authors. MIT license.

import type { Comparator, SemVer } from "./types.ts";

/**
 * ANY is a sentinel value used by some range calculations. It is not a valid
 * SemVer object and should not be used directly.
 */
export const ANY: SemVer = {
  major: Number.NaN,
  minor: Number.NaN,
  patch: Number.NaN,
  prerelease: [],
  build: [],
};

/**
 * A comparator which will span all valid semantic versions
 */
export const ALL: Comparator = {
  operator: undefined,
  ...ANY,
};

export const OPERATORS = [
  undefined,
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
] as const;
