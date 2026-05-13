// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "@std/internal/os";
import { dirname as posixDirname } from "./posix/dirname.ts";
import { dirname as windowsDirname } from "./windows/dirname.ts";

/**
 * Return the directory path of a path.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(dirname("C:\\home\\user\\Documents\\image.png"), "C:\\home\\user\\Documents");
 *   assertEquals(dirname(new URL("file:///C:/home/user/Documents/image.png")), "C:\\home\\user\\Documents");
 * } else {
 *   assertEquals(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 *   assertEquals(dirname(new URL("file:///home/user/Documents/image.png")), "/home/user/Documents");
 * }
 * ```
 *
 * @param path Path to extract the directory from. When passed as a `URL`
 * instance, its protocol must be `file:`. For other protocols, pass the URL
 * as a string or pass its `pathname` property.
 * @returns The directory path.
 * @throws {TypeError} If `path` is a `URL` instance whose protocol is not `file:`.
 */
export function dirname(path: string | URL): string {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
