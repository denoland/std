// Copyright 2018-2025 the Deno authors. MIT license.
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
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(extname("C:\\home\\user\\Documents\\image.png"), ".png");
 * } else {
 *   assertEquals(extname("/home/user/Documents/image.png"), ".png");
 * }
 * ```
 *
 * Note: If you are working with file URLs,
 * use the new version of `extname` from `@std/path/unstable-extname`.
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */
export function extname(path: string): string {
  return isWindows ? windowsExtname(path) : posixExtname(path);
}
