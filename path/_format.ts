// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { FormatInputPathObject } from "./_interface.ts";

function _format(
  sep: string,
  pathObject: FormatInputPathObject,
): string {
  const dir: string | undefined = pathObject.dir || pathObject.root;
  const base: string = pathObject.base ||
    (pathObject.name || "") + (pathObject.ext || "");
  if (!dir) return base;
  if (base === sep) return dir;
  if (dir === pathObject.root) return dir + base;
  return dir + sep + base;
}

function assertArg(pathObject: FormatInputPathObject) {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
}

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function posixFormat(pathObject: FormatInputPathObject): string {
  assertArg(pathObject);
  return _format("/", pathObject);
}

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function windowsFormat(pathObject: FormatInputPathObject): string {
  assertArg(pathObject);
  return _format("\\", pathObject);
}
