// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { isWildcardComparator } from "./_shared.ts";
import { compare } from "./compare.ts";
import { Comparator, SemVer } from "./types.ts";

export function comparatorIncludes(
  version: SemVer,
  comparator: Comparator,
): boolean {
  if (isWildcardComparator(comparator)) {
    return true;
  }
  const cmp = compare(version, comparator.semver ?? comparator);
  switch (comparator.operator) {
    case "":
    case "=":
    case "==":
    case "===":
    case undefined: {
      return cmp === 0;
    }
    case "!=":
    case "!==": {
      return cmp !== 0;
    }
    case ">": {
      return cmp > 0;
    }
    case "<": {
      return cmp < 0;
    }
    case ">=": {
      return cmp >= 0;
    }
    case "<=": {
      return cmp <= 0;
    }
  }
}
