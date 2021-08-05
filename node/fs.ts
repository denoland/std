// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { access, accessSync } from "./_fs/_fs_access.ts";
import { appendFile, appendFileSync } from "./_fs/_fs_appendFile.ts";
import { chmod, chmodSync } from "./_fs/_fs_chmod.ts";
import { chown, chownSync } from "./_fs/_fs_chown.ts";
import { close, closeSync } from "./_fs/_fs_close.ts";
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
import { readdir, readdirSync } from "./_fs/_fs_readdir.ts";
import { readFile, readFileSync } from "./_fs/_fs_readFile.ts";
import { readlink, readlinkSync } from "./_fs/_fs_readlink.ts";
import { realpath, realpathSync } from "./_fs/_fs_realpath.ts";
import { rename, renameSync } from "./_fs/_fs_rename.ts";
import { rmdir, rmdirSync } from "./_fs/_fs_rmdir.ts";
import { stat, statSync } from "./_fs/_fs_stat.ts";
import { symlink, symlinkSync } from "./_fs/_fs_symlink.ts";
import { truncate, truncateSync } from "./_fs/_fs_truncate.ts";
import { unlink, unlinkSync } from "./_fs/_fs_unlink.ts";
import { utimes, utimesSync } from "./_fs/_fs_utimes.ts";
import { watch } from "./_fs/_fs_watch.ts";
import { writeFile, writeFileSync } from "./_fs/_fs_writeFile.ts";

import * as promises from "./fs/promises.ts";

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
  Dir,
  Dirent,
  exists,
  existsSync,
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
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rmdir,
  rmdirSync,
  stat,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  utimes,
  utimesSync,
  watch,
  writeFile,
  writeFileSync,
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
  Dir,
  Dirent,
  exists,
  existsSync,
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
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rmdir,
  rmdirSync,
  stat,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  utimes,
  utimesSync,
  watch,
  writeFile,
  writeFileSync,
};
