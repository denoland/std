// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { dirname as stableDirname } from "./dirname.ts";
import { fromFileUrl } from "./from_file_url.ts";

/**
 * Return the directory path of a file URL.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/posix/unstable-dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("/home/user/Documents/"), "/home/user");
 * assertEquals(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * assertEquals(dirname(new URL("file:///home/user/Documents/image.png")), "/home/user/Documents");
 * ```
 *
 * @param path The file url to get the directory from.
 * @returns The directory path.
 */
export function dirname(path: string | URL): string {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  return stableDirname(path);
}
