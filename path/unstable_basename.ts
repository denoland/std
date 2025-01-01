// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { basename as posixUnstableBasename } from "./posix/unstable_basename.ts";
import { basename as windowsUnstableBasename } from "./windows/unstable_basename.ts";

/**
 * Return the last portion of a path.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * The trailing directory separators are ignored, and optional suffix is
 * removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@std/path/unstable-basename";
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
 * @param path Path to extract the name from.
 * @param suffix Suffix to remove from extracted name.
 *
 * @returns The basename of the path.
 */
export function basename(path: string | URL, suffix = ""): string {
  return isWindows
    ? windowsUnstableBasename(path, suffix)
    : posixUnstableBasename(path, suffix);
}
