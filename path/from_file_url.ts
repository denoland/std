// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import { posixFromFileUrl, windowsFromFileUrl } from "./_from_file_url.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Converts a file URL to a path string.
 *
 * ```ts
 * import { fromFileUrl } from "https://deno.land/std@$STD_VERSION/path/from_file_url.ts";
 *
 * // posix
 * fromFileUrl("file:///home/foo"); // "/home/foo"
 *
 * // win32
 * fromFileUrl("file:///home/foo"); // "\\home\\foo"
 * fromFileUrl("file:///C:/Users/foo"); // "C:\\Users\\foo"
 * fromFileUrl("file://localhost/home/foo"); // "\\\\localhost\\home\\foo"
 * ```
 * @param url of a file URL
 */
export function fromFileUrl(url: string | URL, options?: PathOptions): string {
  return checkWindows(options?.os)
    ? windowsFromFileUrl(url)
    : posixFromFileUrl(url);
}
