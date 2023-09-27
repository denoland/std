// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { posixFormat, windowsFormat } from "./_format.ts";
import { FormatInputPathObject } from "./_interface.ts";

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function format(pathObject: FormatInputPathObject): string {
  return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
