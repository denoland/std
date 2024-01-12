// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Comparator } from "./types.ts";
import * as c from "./_comparator.ts";

/**
 * Parses a comparator string into a valid Comparator.
 * @param comparator
 * @returns A valid Comparator
 *
 * @deprecated (will be removed in 0.214.0) Use {@linkcode parseRange} instead.
 */
export function parseComparator(comparator: string): Comparator {
  return c.parseComparator(comparator);
}
