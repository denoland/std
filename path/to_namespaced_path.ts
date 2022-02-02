import { isPathSeparator, isWindowsDeviceRoot } from "./_util.ts";
import {
  CHAR_BACKWARD_SLASH,
  CHAR_COLON,
  CHAR_DOT,
  CHAR_QUESTION_MARK,
} from "./_constants.ts";
import { resolve } from "./resolve.ts";

/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */
export function toNamespacedPath(
  path: string,
  { os = Deno.build.os }: { os?: typeof Deno.build.os } = {},
): string {
  // Non-op on posix systems
  if (os !== "windows") {
    return path;
  }

  // Note: this will *probably* throw somewhere.
  if (typeof path !== "string") return path;
  if (path.length === 0) return "";

  const resolvedPath = resolve(path);

  if (resolvedPath.length >= 3) {
    if (isPathSeparator(resolvedPath.charCodeAt(0))) {
      // Possible UNC root

      if (isPathSeparator(resolvedPath.charCodeAt(1))) {
        const code = resolvedPath.charCodeAt(2);
        if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
          // Matched non-long UNC root, convert the path to a long UNC path
          return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
        }
      }
    } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
      // Possible device root

      if (
        resolvedPath.charCodeAt(1) === CHAR_COLON &&
        resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH
      ) {
        // Matched device root, convert the path to a long UNC path
        return `\\\\?\\${resolvedPath}`;
      }
    }
  }

  return path;
}
