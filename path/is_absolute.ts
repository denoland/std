import {
  assertPath,
  isPathSeparator,
  isPosixPathSeparator,
  isWindowsDeviceRoot,
} from "./_util.ts";
import { CHAR_COLON } from "./_constants.ts";

/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */
export function isAbsolute(
  path: string,
  { os = Deno.build.os }: { os?: typeof Deno.build.os } = {},
): boolean {
  assertPath(path);
  const len = path.length;
  if (len === 0) return false;
  const code = path.charCodeAt(0);

  if (os === "windows") {
    if (isPathSeparator(code)) {
      return true;
    } else if (isWindowsDeviceRoot(code)) {
      // Possible device root
      if (len > 2 && path.charCodeAt(1) === CHAR_COLON) {
        if (isPathSeparator(path.charCodeAt(2))) return true;
      }
    }
    return false;
  }

  return isPosixPathSeparator(code);
}
