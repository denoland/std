// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "@std/internal/os";
import { basename as posixBasename } from "./posix/basename.ts";
import { basename as windowsBasename } from "./windows/basename.ts";

/**
 * Return the last portion of a path.
 *
 * The trailing directory separators are ignored, and optional suffix is
 * removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/basename";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(basename("C:\\user\\Documents\\image.png"), "image.png");
 *   assertEquals(basename(new URL("file:///C:/user/Documents/image.png")), "image.png");
 * } else {
 *   assertEquals(basename("/home/user/Documents/image.png"), "image.png");
 *   assertEquals(basename(new URL("file:///home/user/Documents/image.png")), "image.png");
 * }
 * ```
 *
 * @param path Path to extract the name from. When passed as a `URL`
 * instance, its protocol must be `file:`. For other protocols, pass the URL
 * as a string or pass its `pathname` property.
 * @param suffix Suffix to remove from extracted name.
 *
 * @returns The basename of the path.
 * @throws {TypeError} If `path` is a `URL` instance whose protocol is not `file:`.
 */
export function basename(path: string | URL, suffix = ""): string {
  return isWindows
    ? windowsBasename(path, suffix)
    : posixBasename(path, suffix);
}
