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
import * as _win32 from "./_win32.ts";
import * as _posix from "./_posix.ts";

export const win32 = {
  ..._win32,
  win32: null as unknown as typeof _win32,
  posix: null as unknown as typeof _posix,
};

export const posix = {
  ..._posix,
  win32: null as unknown as typeof _win32,
  posix: null as unknown as typeof _posix,
};

posix.win32 = win32.win32 = win32;
posix.posix = win32.posix = posix;

const path = isWindows ? win32 : posix;
export const {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  fromFileUrl,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  sep,
  toFileUrl,
  toNamespacedPath,
} = path;

export * from "./common.ts";
export * from "./_interface.ts";
