// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { access, accessSync } from "./_fs/_fs_access.ts";
import { appendFile, appendFileSync } from "./_fs/_fs_appendFile.ts";
import { chmod, chmodSync } from "./_fs/_fs_chmod.ts";
import { chown, chownSync } from "./_fs/_fs_chown.ts";
import { close, closeSync } from "./_fs/_fs_close.ts";
import { createReadStream, ReadStream } from "./_fs/_fs_streams.ts";
import * as constants from "./_fs/_fs_constants.ts";
import { copyFile, copyFileSync } from "./_fs/_fs_copy.ts";
import Dir from "./_fs/_fs_dir.ts";
import Dirent from "./_fs/_fs_dirent.ts";
import { exists, existsSync } from "./_fs/_fs_exists.ts";
import { fdatasync, fdatasyncSync } from "./_fs/_fs_fdatasync.ts";
import { fstat, fstatSync } from "./_fs/_fs_fstat.ts";
import { fsync, fsyncSync } from "./_fs/_fs_fsync.ts";
import { ftruncate, ftruncateSync } from "./_fs/_fs_ftruncate.ts";
import { futimes, futimesSync } from "./_fs/_fs_futimes.ts";
import { link, linkSync } from "./_fs/_fs_link.ts";
import { lstat, lstatSync } from "./_fs/_fs_lstat.ts";
import { mkdir, mkdirSync } from "./_fs/_fs_mkdir.ts";
import { mkdtemp, mkdtempSync } from "./_fs/_fs_mkdtemp.ts";
import { open, openSync } from "./_fs/_fs_open.ts";
import { read, readSync } from "./_fs/_fs_read.ts";
import { readdir, readdirSync } from "./_fs/_fs_readdir.ts";
import { readFile, readFileSync } from "./_fs/_fs_readFile.ts";
import { readlink, readlinkSync } from "./_fs/_fs_readlink.ts";
import { realpath, realpathSync } from "./_fs/_fs_realpath.ts";
import { rename, renameSync } from "./_fs/_fs_rename.ts";
import { rmdir, rmdirSync } from "./_fs/_fs_rmdir.ts";
import { rm, rmSync } from "./_fs/_fs_rm.ts";
import { stat, statSync } from "./_fs/_fs_stat.ts";
import { symlink, symlinkSync } from "./_fs/_fs_symlink.ts";
import { truncate, truncateSync } from "./_fs/_fs_truncate.ts";
import { unlink, unlinkSync } from "./_fs/_fs_unlink.ts";
import { utimes, utimesSync } from "./_fs/_fs_utimes.ts";
import { watch, watchFile } from "./_fs/_fs_watch.ts";
// @deno-types="./_fs/_fs_write.d.ts"
import { write, writeSync } from "./_fs/_fs_write.mjs";
// @deno-types="./_fs/_fs_writev.d.ts"
import { writev, writevSync } from "./_fs/_fs_writev.mjs";
import { writeFile, writeFileSync } from "./_fs/_fs_writeFile.ts";
import { Stats } from "./internal/fs/utils.mjs";
import { createWriteStream, WriteStream } from "./internal/fs/streams.ts";

import { promisify } from "./util.ts";

const {
  F_OK,
  R_OK,
  W_OK,
  X_OK,
} = constants;

const promises = {
  access: promisify(access),
  copyFile: promisify(copyFile),
  open: promisify(open),
  // opendir: promisify(opendir),
  rename: promisify(rename),
  truncate: promisify(truncate),
  rm: promisify(rm),
  rmdir: promisify(rmdir),
  mkdir: promisify(mkdir),
  readdir: promisify(readdir),
  readlink: promisify(readlink),
  symlink: promisify(symlink),
  lstat: promisify(lstat),
  stat: promisify(stat),
  link: promisify(link),
  unlink: promisify(unlink),
  chmod: promisify(chmod),
  // lchmod: promisify(lchmod),
  // lchown: promisify(lchown),
  chown: promisify(chown),
  utimes: promisify(utimes),
  // lutimes = promisify(lutimes),
  realpath: promisify(realpath),
  mkdtemp: promisify(mkdtemp),
  writeFile: promisify(writeFile),
  appendFile: promisify(appendFile),
  readFile: promisify(readFile),
  watch: promisify(watch),
};

export default {
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  close,
  closeSync,
  constants,
  copyFile,
  copyFileSync,
  createReadStream,
  createWriteStream,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  link,
  linkSync,
  lstat,
  lstatSync,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  open,
  openSync,
  read,
  readSync,
  promises,
  R_OK,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  ReadStream,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rmdir,
  rmdirSync,
  rm,
  rmSync,
  stat,
  Stats,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writev,
  writevSync,
  writeFileSync,
  WriteStream,
  writeSync,
  X_OK,
};

export {
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  close,
  closeSync,
  constants,
  copyFile,
  copyFileSync,
  createReadStream,
  createWriteStream,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  link,
  linkSync,
  lstat,
  lstatSync,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  open,
  openSync,
  promises,
  R_OK,
  read,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  readSync,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rm,
  rmdir,
  rmdirSync,
  rmSync,
  stat,
  Stats,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writeFileSync,
  WriteStream,
  writeSync,
  writev,
  writevSync,
  X_OK,
};
