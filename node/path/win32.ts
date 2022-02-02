// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { win32 } from "../path.ts";

export const {
  resolve,
  normalize,
  isAbsolute,
  join,
  relative,
  // _makeLong,
  dirname,
  basename,
  extname,
  format,
  parse,
  sep,
  delimiter,
  // posix
} = win32;

export { win32 };

export default {
  resolve,
  normalize,
  isAbsolute,
  join,
  relative,
  // _makeLong,
  dirname,
  basename,
  extname,
  format,
  parse,
  sep,
  delimiter,
  // posix,
  win32,
};
