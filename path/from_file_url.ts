// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "@std/internal/os";
import { fromFileUrl as posixFromFileUrl } from "./posix/from_file_url.ts";
import { fromFileUrl as windowsFromFileUrl } from "./windows/from_file_url.ts";

/**
 * Converts a file URL to a path string.
 *
 * @example Usage
 * ```ts
 * import { fromFileUrl } from "@std/path/from-file-url";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(fromFileUrl("file:///home/foo"), "\\home\\foo");
 *   assertEquals(fromFileUrl("file:///C:/Users/foo"), "C:\\Users\\foo");
 *   assertEquals(fromFileUrl("file://localhost/home/foo"), "\\home\\foo");
 * } else {
 *   assertEquals(fromFileUrl("file:///home/foo"), "/home/foo");
 * }
 * ```
 *
 * @param url The file URL to convert to a path.
 * @returns The path string.
 */
export function fromFileUrl(url: string | URL): string {
  return isWindows ? windowsFromFileUrl(url) : posixFromFileUrl(url);
}
