// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { SemVerRange } from "./types.ts";
import { parseRange } from "./parse_range.ts";

/**
 * A tries to parse a valid SemVerRange string or returns undefined
 * @param range The range string
 * @returns A SemVerRange object if valid otherwise `undefined`
 * @deprecated (will be removed after 0.212.0) use {@linkcode tryParseRangeSet} instead.
 */
export function tryParseRange(
  range: string,
): SemVerRange | undefined {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return parseRange(range);
  } catch {
    return undefined;
  }
}
