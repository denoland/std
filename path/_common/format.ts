// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { FormatInputPathObject } from "../_interface.ts";

export function _format(
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
