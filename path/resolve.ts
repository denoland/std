// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixResolve, windowsResolve } from "./_resolve.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Resolves path segments into a `path`
 */
export function resolve(...args: string[]): string;
export function resolve(...args: [...string[], PathOptions]): string;
// deno-lint-ignore no-explicit-any
export function resolve(...args: any[]) {
  let options: PathOptions | undefined;
  if (typeof args[args.length - 1] === "object") {
    options = args.pop();
  }
  return checkWindows(options?.os)
    ? windowsResolve(...args)
    : posixResolve(...args);
}
