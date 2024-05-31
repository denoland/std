// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { extname as posixExtname } from "./posix/extname.ts";
import { extname as windowsExtname } from "./windows/extname.ts";
/**
 * Return the extension of the path with leading period (".").
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/extname";
 *
 * extname("/home/user/Documents/image.png"); // ".png"
 * extname("C:\\user\\Documents\\image.png"); // ".png"
 * ```
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */
export function extname(path: string): string {
  return isWindows ? windowsExtname(path) : posixExtname(path);
}
