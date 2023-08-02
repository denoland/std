// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "../_util/os.ts";
import { CHAR_COLON } from "./_constants.ts";
import {
  assertPath,
  isPathSeparator,
  isPosixPathSeparator,
  isWindowsDeviceRoot,
} from "./_util.ts";

function windowsIsAbsolute(path: string): boolean {
  const len = path.length;
  if (len === 0) return false;

  const code = path.charCodeAt(0);
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

/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */
export function isAbsolute(path: string): boolean {
  assertPath(path);
  if (isWindows) {
    return windowsIsAbsolute(path);
  }
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
