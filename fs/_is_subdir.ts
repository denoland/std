// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.

import { SEPARATOR } from "@std/path/constants";
import { toPathString } from "./_to_path_string.ts";

/**
 * Checks whether `src` is a sub-directory of `dest`.
 *
 * @param src Source file path as a string or URL.
 * @param dest Destination file path as a string or URL.
 * @param sep Path separator. Defaults to `\\` for Windows and `/` for other
 * platforms.
 *
 * @returns `true` if `src` is a sub-directory of `dest`, `false` otherwise.
 */
export function isSubdir(
  src: string | URL,
  dest: string | URL,
  sep = SEPARATOR,
): boolean {
  if (src === dest) {
    return false;
  }
  src = toPathString(src);
  const srcArray = src.split(sep);
  dest = toPathString(dest);
  const destArray = dest.split(sep);
  return srcArray.every((current, i) => destArray[i] === current);
}
