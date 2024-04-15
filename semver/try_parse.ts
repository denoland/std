// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import type { SemVer } from "./types.ts";
import { parse } from "./parse.ts";

/**
 * Returns the parsed version, or undefined if it's not valid.
 * @param version The version string to parse
 * @returns A valid SemVer or `undefined`
 */
export function tryParse(version?: string): SemVer | undefined {
  if (version === undefined) {
    return undefined;
  }
  try {
    return parse(version);
  } catch {
    return undefined;
  }
}
