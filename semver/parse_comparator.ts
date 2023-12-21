// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { parse } from "./parse.ts";
import type { Operator, SemVerComparator } from "./types.ts";
import { COMPARATOR_REGEXP } from "./_shared.ts";
import { comparatorMin } from "./comparator_min.ts";
import { comparatorMax } from "./comparator_max.ts";
import { ANY, NONE } from "./constants.ts";

/**
 * Parses a comparator string into a valid SemVerComparator.
 * @param comparator
 * @returns A valid SemVerComparator
 */
export function parseComparator(comparator: string): SemVerComparator {
  const m = comparator.match(COMPARATOR_REGEXP);

  if (!m) {
    return NONE;
  }

  const operator = (m[1] ?? "") as Operator;
  const semver = m[2] ? parse(m[2]) : ANY;
  const min = comparatorMin(semver, operator);
  const max = comparatorMax(semver, operator);
  return { operator, semver, min, max };
}
