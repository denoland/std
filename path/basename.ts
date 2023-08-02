// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "../_util/os.ts";
import { CHAR_COLON } from "./_constants.ts";
import {
  assertPath,
  isPathSeparator,
  isPosixPathSeparator,
  isWindowsDeviceRoot,
  lastPathSegment,
  stripSuffix,
  stripTrailingSeparators,
} from "./_util.ts";

function posixBasename(path: string, suffix = ""): string {
  const lastSegment = lastPathSegment(path, isPosixPathSeparator);
  const strippedSegment = stripTrailingSeparators(
    lastSegment,
    isPosixPathSeparator,
  );
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}

function windowsBasename(path: string, suffix = ""): string {
  // Check for a drive letter prefix so as not to mistake the following
  // path separator as an extra separator at the end of the path that can be
  // disregarded
  let start = 0;
  if (path.length >= 2) {
    const drive = path.charCodeAt(0);
    if (isWindowsDeviceRoot(drive)) {
      if (path.charCodeAt(1) === CHAR_COLON) start = 2;
    }
  }

  const lastSegment = lastPathSegment(path, isPathSeparator, start);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}

/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */
export function basename(path: string, suffix = ""): string {
  assertPath(path);
  if (path.length === 0) return path;
  if (typeof suffix !== "string") {
    throw new TypeError(
      `Suffix must be a string. Received ${JSON.stringify(suffix)}`,
    );
  }

  if (isWindows) {
    return windowsBasename(path, suffix);
  }
  return posixBasename(path, suffix);
}
