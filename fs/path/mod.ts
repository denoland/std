// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/

import { win32 as _win32 } from "./win32.ts";
import { posix as _posix } from "./posix.ts";

import { isWindows } from "./constants.ts";

_posix.win32 = _win32.win32 = _win32;
_posix.posix = _win32.posix = _posix;

const module = isWindows ? _win32 : _posix;
export const win32 = _win32;
export const posix = _posix;
export const resolve = module.resolve;
export const normalize = module.normalize;
export const isAbsolute = module.isAbsolute;
export const join = module.join;
export const relative = module.relative;
export const toNamespacedPath = module.toNamespacedPath;
export const dirname = module.dirname;
export const basename = module.basename;
export const extname = module.extname;
export const format = module.format;
export const parse = module.parse;
export const sep = module.sep;
export const delimiter = module.delimiter;
