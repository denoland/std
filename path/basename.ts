// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { basename as posixBasename } from "./posix/basename.ts";
import { basename as windowsBasename } from "./windows/basename.ts";

/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/basename";
 *
 * basename("/home/user/Documents/"); // "Documents"
 * basename("C:\\user\\Documents\\image.png"); // "image.png"
 * basename("/home/user/Documents/image.png", ".png"); // "image"
 * ```
 *
 * @param path Path to extract the name from.
 * @param suffice Suffix to remove from extracted name.
 * @returns The basename of the path.
 */
export function basename(path: string, suffix = ""): string {
  return isWindows
    ? windowsBasename(path, suffix)
    : posixBasename(path, suffix);
}
