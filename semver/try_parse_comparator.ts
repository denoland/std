// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { SemVerComparator } from "./types.ts";
import { parseComparator } from "./parse_comparator.ts";
/**
 * Parses a comparator string into a valid SemVerComparator or returns undefined if not valid.
 * @param comparator
 * @returns A valid SemVerComparator or undefined
 * @deprecated (will be removed after 0.213.0) Use {@linkcode parseComparator} inside a try-catch statement instead.
 */
export function tryParseComparator(
  comparator: string,
): SemVerComparator | undefined {
  try {
    return parseComparator(comparator);
  } catch {
    return undefined;
  }
}
