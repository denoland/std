// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "@std/internal/os";
import { toFileUrl as posixToFileUrl } from "./posix/to_file_url.ts";
import { toFileUrl as windowsToFileUrl } from "./windows/to_file_url.ts";

/**
 * Converts a path string to a file URL.
 *
 * @example Usage
 * ```ts
 * import { toFileUrl } from "@std/path/to-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(toFileUrl("\\home\\foo"), new URL("file:///home/foo"));
 *   assertEquals(toFileUrl("C:\\Users\\foo"), new URL("file:///C:/Users/foo"));
 *   assertEquals(toFileUrl("\\\\127.0.0.1\\home\\foo"), new URL("file://127.0.0.1/home/foo"));
 * } else {
 *   assertEquals(toFileUrl("/home/foo"), new URL("file:///home/foo"));
 * }
 * ```
 *
 * @param path Path to convert to file URL.
 * @returns The file URL equivalent to the path.
 */
export function toFileUrl(path: string): URL {
  return isWindows ? windowsToFileUrl(path) : posixToFileUrl(path);
}
