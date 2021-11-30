import type { FormatInputPathObject } from "./_interface.ts";
import { _format } from "./_util.ts";
import { separators } from "./separator.ts";

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function format(
  pathObject: FormatInputPathObject,
  { os = Deno.build.os }: { os?: typeof Deno.build.os } = {},
): string {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
  return _format(
    os === "windows" ? separators.win32 : separators.posix,
    pathObject,
  );
}
