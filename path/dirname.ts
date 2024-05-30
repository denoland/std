// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { dirname as posixDirname } from "./posix/dirname.ts";
import { dirname as windowsDirname } from "./windows/dirname.ts";

/**
 * Return the directory path of a pauth.
 *
 * @param path Path to extract the directory from.
 *
 * @returns The directory path.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/dirname";
 *
 * dirname("/home/user/Documents/image.png"); // "/home/user/Documents"
 * dirname("C:\\user\\Documents\\image.png"); // "C:\\user\\Documents"
 * dirname("image.png"); // "."
 * ```
 */
export function dirname(path: string): string {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
