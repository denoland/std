// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { _format } from "../_common/format.ts";
import type { FormatInputPathObject } from "../_interface.ts";

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function format(pathObject: FormatInputPathObject): string {
  return _format("/", pathObject);
}
