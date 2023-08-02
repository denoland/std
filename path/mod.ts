// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported mostly from https://github.com/browserify/path-browserify/
// This module is browser compatible.

/**
 * Utilities for working with OS-specific file paths.
 *
 * Codes in the examples uses POSIX path but it automatically use Windows path
 * on Windows. Use methods under `posix` or `win32` object instead to handle non
 * platform specific path like:
 * ```ts
 * import { posix, win32 } from "https://deno.land/std@$STD_VERSION/path/mod.ts";
 * const p1 = posix.fromFileUrl("file:///home/foo");
 * const p2 = win32.fromFileUrl("file:///home/foo");
 * console.log(p1); // "/home/foo"
 * console.log(p2); // "\\home\\foo"
 * ```
 *
 * This module is browser compatible.
 *
 * @module
 */

import { isWindows } from "../_util/os.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";

export const win32 = _win32;
export const posix = _posix;
export const delimiter = isWindows ? win32.delimiter : posix.delimiter;

export { basename } from "./basename.ts";
export { dirname } from "./dirname.ts";
export { extname } from "./extname.ts";
export { format } from "./format.ts";
export { fromFileUrl } from "./from_file_url.ts";
export { isAbsolute } from "./is_absolute.ts";
export { join } from "./join.ts";
export { normalize } from "./normalize.ts";
export { parse } from "./parse.ts";
export { relative } from "./relative.ts";
export { resolve } from "./resolve.ts";
export { toFileUrl } from "./to_file_url.ts";
export { toNamespacedPath } from "./to_namespaced_path.ts";

export * from "./common.ts";
export { SEP, SEP_PATTERN } from "./separator.ts";
export * from "./_interface.ts";
export * from "./glob.ts";
