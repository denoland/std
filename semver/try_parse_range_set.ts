// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { RangeSet } from "./types.ts";
import { parseRangeSet } from "./parse_range_set.ts";

/**
 * A tries to parse a valid SemVerRange string or returns undefined
 * @param range The range string
 * @returns A SemVerRange object if valid otherwise `undefined`
 */
export function tryParseRangeSet(
  range: string,
): RangeSet | undefined {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return parseRangeSet(range);
  } catch {
    return undefined;
  }
}
