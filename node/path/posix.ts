import { posix } from "../path.ts";

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
  // win32
} = posix;

export { posix };

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
  posix,
  // win32
};
