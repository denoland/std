import { FormatInputPathObject } from "./_interface.ts";
import { _format } from "./_util.ts";

function posixFormat(pathObject: FormatInputPathObject): string {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
  return _format("/", pathObject);
}

function windowsFormat(pathObject: FormatInputPathObject): string {
  if (pathObject === null || typeof pathObject !== "object") {
    throw new TypeError(
      `The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`,
    );
  }
  return _format("\\", pathObject);
}

/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */
export function format(pathObject: FormatInputPathObject): string {
  if(Deno.build.os === "windows") {
    return windowsFormat(pathObject);
  }
  return posixFormat(pathObject);
}