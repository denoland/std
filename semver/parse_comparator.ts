// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { parse } from "./parse.ts";
import type { Operator, SemVerComparator } from "./types.ts";
import { comparatorMax } from "./comparator_max.ts";
import { comparatorMin } from "./comparator_min.ts";
import { ANY, NONE } from "./constants.ts";
import { FULL_REGEXP, OPERATOR_REGEXP } from "./_shared.ts";

/**
 * Parses a comparator string into a valid SemVerComparator.
 * @param comparator
 * @returns A valid SemVerComparator
 */
export function parseComparator(comparator: string): SemVerComparator {
  const operatorMatch = comparator.match(OPERATOR_REGEXP);
  if (!operatorMatch) return NONE;

  const operator = (operatorMatch.groups!.operator ?? "") as Operator;
  const vMatch = comparator.slice(operatorMatch[0].length).match(FULL_REGEXP);

  if (!vMatch) return NONE;

  const versionMatch = vMatch?.[0];
  const semver = versionMatch ? parse(versionMatch) : ANY;
  const min = comparatorMin(semver, operator);
  const max = comparatorMax(semver, operator);
  return {
    operator,
    semver,
    min,
    max,
  };
}
