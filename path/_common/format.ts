// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { ParsedPath } from "../types.ts";

export function _format(
  sep: string,
  pathObject: Partial<ParsedPath>,
): string {
  const dir: string | undefined = pathObject.dir || pathObject.root;
  const base: string = pathObject.base ||
    (pathObject.name ?? "") + (pathObject.ext ?? "");
  if (!dir) return base;
  if (base === sep) return dir;
  if (dir === pathObject.root) return dir + base;
  return dir + sep + base;
}

export function assertArg(pathObject: Partial<ParsedPath>) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object, received type "${typeof pathObject}"`,
    );
  }
}
