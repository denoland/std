// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { FormatInputPathObject } from "./_interface.ts";
import { _format } from "./_util.ts";

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function format(pathObject: FormatInputPathObject): string {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }

  if (Deno.build.os === "windows") {
    return _format("\\", pathObject);
  }
  return _format("/", pathObject);
}
