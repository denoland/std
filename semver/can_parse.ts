// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { SemVer } from "./types.ts";
import { parse } from "./parse.ts";

/**
 * @deprecated (will be removed in 0.212.0) Use a string argument instead.
 */
export function canParse(version: SemVer): boolean;
export function canParse(version: string): boolean;
export function canParse(version: string | SemVer) {
  try {
    parse(version as SemVer);
    return true;
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    return false;
  }
}
