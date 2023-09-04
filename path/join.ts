// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixJoin, windowsJoin } from "./_join.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 */
export function join(...args: string[]): string;
export function join(...args: [...string[], PathOptions]): string;
// deno-lint-ignore no-explicit-any
export function join(...args: any[]) {
  let options: PathOptions | undefined;
  if (typeof args[args.length - 1] === "object") {
    options = args.pop();
  }
  return checkWindows(options?.os) ? windowsJoin(...args) : posixJoin(...args);
}
